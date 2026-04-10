package com.sonar.workflow.service;

import com.sonar.workflow.entity.*;
import com.sonar.workflow.repository.AttachmentRepository;
import com.sonar.workflow.repository.StampRepository;
import com.sonar.workflow.repository.UserSignatureRepository;
import com.sonar.workflow.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.poi.util.Units;
import org.apache.poi.xwpf.model.XWPFHeaderFooterPolicy;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentStampService {

    private final AttachmentRepository attachmentRepository;
    private final StampRepository stampRepository;
    private final UserSignatureRepository userSignatureRepository;
    private final EncryptionUtil encryptionUtil;

    /**
     * Stamps all PDF attachments for a workflow instance with the approval stamp,
     * date, and approver's signature. Called when workflow is fully approved.
     */
    @Transactional
    public void stampAttachments(UUID instanceId, UUID lastStampId, User approver) {
        log.info("Starting attachment stamping for instance {} with stamp {}", instanceId, lastStampId);
        List<Attachment> attachments = attachmentRepository.findByWorkflowInstanceId(instanceId);
        if (attachments.isEmpty()) {
            log.info("No attachments found to stamp for instance {}", instanceId);
            return;
        }
        log.info("Found {} attachments for instance {}", attachments.size(), instanceId);

        // Get stamp info
        Stamp stamp = null;
        if (lastStampId != null) {
            stamp = stampRepository.findById(lastStampId).orElse(null);
        }
        if (stamp == null) {
            log.warn("Stamp {} not found in database, skipping attachment stamping", lastStampId);
            return;
        }

        // Get approver's signature
        byte[] signatureBytes = null;
        try {
            var sig = userSignatureRepository.findByUserIdAndIsCurrentTrue(approver.getId());
            if (sig.isPresent()) {
                String sigData = sig.get().getSignatureData();
                log.info("Signature found for user {}, data length: {}, starts with: {}",
                        approver.getUsername(), sigData != null ? sigData.length() : 0,
                        sigData != null ? sigData.substring(0, Math.min(50, sigData.length())) : "null");
                if (sigData != null && !sigData.isBlank()) {
                    if (sigData.startsWith("<svg") || sigData.startsWith("<?xml")) {
                        // SVG signature - render to PNG for embedding
                        signatureBytes = renderSvgToPng(sigData);
                        if (signatureBytes != null) {
                            log.info("SVG signature rendered to PNG: {} bytes", signatureBytes.length);
                        } else {
                            log.warn("SVG signature render returned null for user {}", approver.getUsername());
                        }
                    } else if (sigData.startsWith("data:")) {
                        // Data URI (e.g., data:image/png;base64,...)
                        String base64Part = sigData.contains(",") ? sigData.split(",")[1] : sigData;
                        signatureBytes = Base64.getDecoder().decode(base64Part);
                        log.info("Data URI signature decoded: {} bytes", signatureBytes.length);
                    } else if (sigData.contains(",")) {
                        // Legacy format with comma separator
                        signatureBytes = Base64.getDecoder().decode(sigData.split(",")[1]);
                        log.info("Legacy signature decoded: {} bytes", signatureBytes.length);
                    } else {
                        // Try plain base64
                        try {
                            signatureBytes = Base64.getDecoder().decode(sigData);
                            log.info("Plain base64 signature decoded: {} bytes", signatureBytes.length);
                        } catch (Exception e) {
                            log.warn("Could not decode signature data for user {}: unknown format", approver.getUsername());
                        }
                    }
                }
            } else {
                log.info("No current signature found for user {}", approver.getUsername());
            }
        } catch (Exception e) {
            log.warn("Could not load signature for user {}: {}", approver.getUsername(), e.getMessage());
        }

        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
        String approverName = approver.getFullName();
        String stampName = stamp.getName();
        String stampColor = stamp.getStampColor() != null ? stamp.getStampColor() : "#c62828";
        String stampSvg = stamp.getSvgContent();

        // Render the stamp SVG to a PNG image for embedding
        byte[] stampImageBytes = null;
        if (stampSvg != null && !stampSvg.isBlank()) {
            stampImageBytes = renderSvgToPng(stampSvg);
            if (stampImageBytes != null) {
                log.info("Stamp SVG rendered to PNG: {} bytes", stampImageBytes.length);
            }
        }

        int stamped = 0;
        for (Attachment attachment : attachments) {
            try {
                String fileName = attachment.getOriginalFilename();
                String contentType = attachment.getContentType();
                log.info("Processing attachment: {} (type: {})", fileName, contentType);
                if (isPdf(attachment)) {
                    log.info("Stamping PDF: {}", fileName);
                    stampPdfAttachment(attachment, stampName, stampColor, dateStr, approverName, signatureBytes, stampImageBytes);
                    stamped++;
                } else if (isWord(attachment)) {
                    log.info("Stamping Word doc: {}", fileName);
                    stampWordAttachment(attachment, stampName, stampColor, dateStr, approverName, signatureBytes, stampImageBytes);
                    stamped++;
                } else if (isImage(attachment)) {
                    log.info("Stamping image: {}", fileName);
                    stampImageAttachment(attachment, stampName, stampColor, dateStr, approverName, signatureBytes, stampImageBytes);
                    stamped++;
                } else {
                    log.info("Skipping unsupported file type for stamping: {} (type: {})", fileName, contentType);
                }
            } catch (Exception e) {
                log.error("Failed to stamp attachment {}: {}", attachment.getOriginalFilename(), e.getMessage());
            }
        }
        log.info("Stamped {}/{} attachments for instance {}", stamped, attachments.size(), instanceId);
    }

    private boolean isPdf(Attachment attachment) {
        String ct = attachment.getContentType();
        String fn = attachment.getOriginalFilename();
        return (ct != null && ct.contains("pdf")) ||
               (fn != null && fn.toLowerCase().endsWith(".pdf"));
    }

    private boolean isWord(Attachment attachment) {
        String ct = attachment.getContentType();
        String fn = attachment.getOriginalFilename();
        return (ct != null && (ct.contains("wordprocessingml") || ct.contains("msword"))) ||
               (fn != null && (fn.toLowerCase().endsWith(".docx") || fn.toLowerCase().endsWith(".doc")));
    }

    private boolean isImage(Attachment attachment) {
        String ct = attachment.getContentType();
        String fn = attachment.getOriginalFilename();
        if (ct != null && ct.startsWith("image/")) return true;
        if (fn != null) {
            String lower = fn.toLowerCase();
            return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") ||
                   lower.endsWith(".bmp") || lower.endsWith(".tiff") || lower.endsWith(".tif");
        }
        return false;
    }

    private void stampPdfAttachment(Attachment attachment, String stampName, String stampColor,
                                     String dateStr, String approverName, byte[] signatureBytes, byte[] stampImageBytes) throws Exception {
        Path filePath = Paths.get(attachment.getFilePath());
        if (!Files.exists(filePath)) {
            log.warn("Attachment file not found: {}", filePath);
            return;
        }

        // Decrypt the file to memory
        byte[] decryptedBytes;
        if (Boolean.TRUE.equals(attachment.getIsEncrypted())) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            if (!encryptionUtil.decryptFile(filePath, baos)) {
                log.error("Failed to decrypt attachment: {}", attachment.getOriginalFilename());
                return;
            }
            decryptedBytes = baos.toByteArray();
        } else {
            decryptedBytes = Files.readAllBytes(filePath);
        }

        // Load and stamp the PDF
        byte[] stampedBytes;
        try (PDDocument doc = Loader.loadPDF(decryptedBytes)) {
            for (int i = 0; i < doc.getNumberOfPages(); i++) {
                PDPage page = doc.getPage(i);
                stampPage(doc, page, stampName, stampColor, dateStr, approverName, signatureBytes, stampImageBytes);
            }

            ByteArrayOutputStream outBaos = new ByteArrayOutputStream();
            doc.save(outBaos);
            stampedBytes = outBaos.toByteArray();
        }

        // Re-encrypt and write back
        if (Boolean.TRUE.equals(attachment.getIsEncrypted())) {
            try (InputStream is = new ByteArrayInputStream(stampedBytes);
                 OutputStream os = Files.newOutputStream(filePath)) {
                EncryptionUtil.EncryptionResult result = encryptionUtil.encryptFile(is, os);
                if (result.success()) {
                    attachment.setEncryptionIv(result.iv());
                    attachment.setFileSize((long) stampedBytes.length);
                    attachmentRepository.save(attachment);
                }
            }
        } else {
            Files.write(filePath, stampedBytes);
            attachment.setFileSize((long) stampedBytes.length);
            attachmentRepository.save(attachment);
        }
    }

    private void stampWordAttachment(Attachment attachment, String stampName, String stampColor,
                                      String dateStr, String approverName, byte[] signatureBytes, byte[] stampImageBytes) throws Exception {
        Path filePath = Paths.get(attachment.getFilePath());
        if (!Files.exists(filePath)) {
            log.warn("Attachment file not found: {}", filePath);
            return;
        }

        // Only .docx is supported (not legacy .doc)
        String fn = attachment.getOriginalFilename();
        if (fn != null && fn.toLowerCase().endsWith(".doc") && !fn.toLowerCase().endsWith(".docx")) {
            log.debug("Skipping legacy .doc file: {}", fn);
            return;
        }

        // Decrypt the file to memory
        byte[] decryptedBytes;
        if (Boolean.TRUE.equals(attachment.getIsEncrypted())) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            if (!encryptionUtil.decryptFile(filePath, baos)) {
                log.error("Failed to decrypt attachment: {}", attachment.getOriginalFilename());
                return;
            }
            decryptedBytes = baos.toByteArray();
        } else {
            decryptedBytes = Files.readAllBytes(filePath);
        }

        // Load and stamp the Word document — use footer so stamp appears on every page
        byte[] stampedBytes;
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(decryptedBytes))) {
            // Create or get the default footer for every page
            XWPFHeaderFooterPolicy policy = doc.getHeaderFooterPolicy();
            if (policy == null) {
                doc.createHeaderFooterPolicy();
                policy = doc.getHeaderFooterPolicy();
            }

            // Create default footer
            XWPFFooter footer = policy.createFooter(XWPFHeaderFooterPolicy.DEFAULT);

            // Add stamp image to footer (right-aligned)
            if (stampImageBytes != null) {
                try {
                    XWPFParagraph pStampImg = footer.createParagraph();
                    pStampImg.setAlignment(ParagraphAlignment.RIGHT);
                    XWPFRun runStampImg = pStampImg.createRun();
                    runStampImg.addPicture(new ByteArrayInputStream(stampImageBytes),
                            XWPFDocument.PICTURE_TYPE_PNG, "stamp.png",
                            Units.toEMU(80), Units.toEMU(80));
                } catch (Exception e) {
                    log.debug("Could not embed stamp image in Word footer: {}", e.getMessage());
                }
            }

            // Add text details below stamp image in footer
            XWPFParagraph pDetails = footer.createParagraph();
            pDetails.setAlignment(ParagraphAlignment.RIGHT);
            pDetails.setSpacingAfter(0);

            XWPFRun runDate = pDetails.createRun();
            runDate.setText("Date: " + dateStr + "  |  By: " + approverName);
            runDate.setFontSize(7);
            runDate.setColor(stampColor.replace("#", ""));
            runDate.setFontFamily("Arial");

            // Add signature to footer
            if (signatureBytes != null) {
                try {
                    XWPFParagraph pSig = footer.createParagraph();
                    pSig.setAlignment(ParagraphAlignment.RIGHT);
                    XWPFRun runSig = pSig.createRun();
                    runSig.addPicture(new ByteArrayInputStream(signatureBytes),
                            XWPFDocument.PICTURE_TYPE_PNG, "signature.png",
                            Units.toEMU(70), Units.toEMU(20));
                } catch (Exception e) {
                    log.debug("Could not embed signature in Word footer: {}", e.getMessage());
                }
            }

            ByteArrayOutputStream outBaos = new ByteArrayOutputStream();
            doc.write(outBaos);
            stampedBytes = outBaos.toByteArray();
        }

        // Re-encrypt and write back
        if (Boolean.TRUE.equals(attachment.getIsEncrypted())) {
            try (InputStream is = new ByteArrayInputStream(stampedBytes);
                 OutputStream os = Files.newOutputStream(filePath)) {
                EncryptionUtil.EncryptionResult result = encryptionUtil.encryptFile(is, os);
                if (result.success()) {
                    attachment.setEncryptionIv(result.iv());
                    attachment.setFileSize((long) stampedBytes.length);
                    attachmentRepository.save(attachment);
                }
            }
        } else {
            Files.write(filePath, stampedBytes);
            attachment.setFileSize((long) stampedBytes.length);
            attachmentRepository.save(attachment);
        }
    }

    private void addSignaturePlaceholder(XWPFTableCell cell, String stampColor) {
        XWPFParagraph pSig = cell.addParagraph();
        pSig.setAlignment(ParagraphAlignment.CENTER);
        pSig.setSpacingBefore(40);
        pSig.setBorderBottom(org.apache.poi.xwpf.usermodel.Borders.DASHED);
        XWPFRun runSig = pSig.createRun();
        runSig.setText("Signature");
        runSig.setFontSize(7);
        runSig.setColor(stampColor.replace("#", ""));
        runSig.setFontFamily("Arial");
    }

    private void stampImageAttachment(Attachment attachment, String stampName, String stampColor,
                                       String dateStr, String approverName, byte[] signatureBytes, byte[] stampImageBytes) throws Exception {
        Path filePath = Paths.get(attachment.getFilePath());
        if (!Files.exists(filePath)) {
            log.warn("Attachment file not found: {}", filePath);
            return;
        }

        // Decrypt the file to memory
        byte[] decryptedBytes;
        if (Boolean.TRUE.equals(attachment.getIsEncrypted())) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            if (!encryptionUtil.decryptFile(filePath, baos)) {
                log.error("Failed to decrypt attachment: {}", attachment.getOriginalFilename());
                return;
            }
            decryptedBytes = baos.toByteArray();
        } else {
            decryptedBytes = Files.readAllBytes(filePath);
        }

        // Load the image
        BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(decryptedBytes));
        if (originalImage == null) {
            log.warn("Could not read image: {}", attachment.getOriginalFilename());
            return;
        }

        // Create a copy to draw on
        BufferedImage stampedImage = new BufferedImage(
                originalImage.getWidth(), originalImage.getHeight(), BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = stampedImage.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // Draw the original image
        g2d.drawImage(originalImage, 0, 0, null);

        // Parse stamp color
        Color color = Color.decode(stampColor);
        Color semiTransparent = new Color(color.getRed(), color.getGreen(), color.getBlue(), 180);

        // If we have the actual stamp image, draw it
        int stampSize = Math.max(150, originalImage.getWidth() / 4);
        int stampX = originalImage.getWidth() - stampSize - 20;
        int textBaseY;

        if (stampImageBytes != null) {
            try {
                BufferedImage stampImg = ImageIO.read(new ByteArrayInputStream(stampImageBytes));
                if (stampImg != null) {
                    int imgSize = stampSize;
                    int imgH = imgSize * stampImg.getHeight() / stampImg.getWidth();
                    int stampY = originalImage.getHeight() - imgH - 80;
                    g2d.drawImage(stampImg, stampX, stampY, imgSize, imgH, null);
                    textBaseY = stampY + imgH + 5;
                } else {
                    textBaseY = originalImage.getHeight() - 70;
                }
            } catch (Exception e) {
                textBaseY = originalImage.getHeight() - 70;
            }
        } else {
            textBaseY = originalImage.getHeight() - 70;
        }

        // Draw date, approver, and signature below the stamp image
        Font smallFont = new Font("Arial", Font.PLAIN, Math.max(10, stampSize / 14));
        g2d.setFont(smallFont);
        g2d.setColor(semiTransparent);
        FontMetrics fm = g2d.getFontMetrics();
        int centerX = stampX + stampSize / 2;

        String dateText = "Date: " + dateStr;
        g2d.drawString(dateText, centerX - fm.stringWidth(dateText) / 2, textBaseY + fm.getHeight());

        String byText = "By: " + approverName;
        g2d.drawString(byText, centerX - fm.stringWidth(byText) / 2, textBaseY + fm.getHeight() * 2 + 2);

        // Signature image if available
        if (signatureBytes != null) {
            try {
                BufferedImage sigImage = ImageIO.read(new ByteArrayInputStream(signatureBytes));
                if (sigImage != null) {
                    int sigWidth = Math.min(stampSize - 20, 100);
                    int sigHeight = sigWidth * sigImage.getHeight() / sigImage.getWidth();
                    g2d.drawImage(sigImage, centerX - sigWidth / 2, textBaseY + fm.getHeight() * 2 + 10, sigWidth, sigHeight, null);
                }
            } catch (Exception e) {
                log.debug("Could not embed signature in image: {}", e.getMessage());
            }
        }

        g2d.dispose();

        // Determine output format
        String fn = attachment.getOriginalFilename();
        String format = "png";
        if (fn != null) {
            String lower = fn.toLowerCase();
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) format = "jpg";
            else if (lower.endsWith(".bmp")) format = "bmp";
            else if (lower.endsWith(".tiff") || lower.endsWith(".tif")) format = "tiff";
        }

        // For JPEG, convert to RGB (no alpha)
        BufferedImage outputImage = stampedImage;
        if ("jpg".equals(format)) {
            outputImage = new BufferedImage(stampedImage.getWidth(), stampedImage.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = outputImage.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, outputImage.getWidth(), outputImage.getHeight());
            g.drawImage(stampedImage, 0, 0, null);
            g.dispose();
        }

        ByteArrayOutputStream outBaos = new ByteArrayOutputStream();
        ImageIO.write(outputImage, format, outBaos);
        byte[] stampedBytes = outBaos.toByteArray();

        // Re-encrypt and write back
        if (Boolean.TRUE.equals(attachment.getIsEncrypted())) {
            try (InputStream is = new ByteArrayInputStream(stampedBytes);
                 OutputStream os = Files.newOutputStream(filePath)) {
                EncryptionUtil.EncryptionResult result = encryptionUtil.encryptFile(is, os);
                if (result.success()) {
                    attachment.setEncryptionIv(result.iv());
                    attachment.setFileSize((long) stampedBytes.length);
                    attachmentRepository.save(attachment);
                }
            }
        } else {
            Files.write(filePath, stampedBytes);
            attachment.setFileSize((long) stampedBytes.length);
            attachmentRepository.save(attachment);
        }
    }

    private void stampPage(PDDocument doc, PDPage page, String stampName, String stampColor,
                           String dateStr, String approverName, byte[] signatureBytes, byte[] stampImageBytes) throws Exception {
        PDRectangle mediaBox = page.getMediaBox();
        float pageWidth = mediaBox.getWidth();

        // Parse stamp color to RGB
        float[] rgb = hexToRgb(stampColor);

        PDType1Font fontNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
            cs.setStrokingColor(rgb[0], rgb[1], rgb[2]);
            cs.setNonStrokingColor(rgb[0], rgb[1], rgb[2]);

            // If we have the actual stamp image (SVG rendered to PNG), use it
            if (stampImageBytes != null) {
                try {
                    PDImageXObject stampImg = PDImageXObject.createFromByteArray(doc, stampImageBytes, "stamp.png");
                    // Scale stamp to fit nicely - about 120pt wide
                    float stampW = 120;
                    float stampH = stampW * stampImg.getHeight() / stampImg.getWidth();
                    float stampX = pageWidth - stampW - 30;
                    float stampY = 60; // above the text area

                    cs.drawImage(stampImg, stampX, stampY, stampW, stampH);

                    // Draw date and approver below the stamp image
                    float textCenterX = stampX + stampW / 2;
                    float textY = stampY - 12;

                    cs.beginText();
                    cs.setFont(fontNormal, 7);
                    String dateLine = "Date: " + dateStr;
                    float dateW = fontNormal.getStringWidth(dateLine) / 1000 * 7;
                    cs.newLineAtOffset(textCenterX - dateW / 2, textY);
                    cs.showText(dateLine);
                    cs.endText();

                    textY -= 10;
                    cs.beginText();
                    cs.setFont(fontNormal, 7);
                    String byLine = "By: " + approverName;
                    float byW = fontNormal.getStringWidth(byLine) / 1000 * 7;
                    cs.newLineAtOffset(textCenterX - byW / 2, textY);
                    cs.showText(byLine);
                    cs.endText();

                    // Signature below approver name
                    textY -= 5;
                    if (signatureBytes != null) {
                        try {
                            PDImageXObject sigImage = PDImageXObject.createFromByteArray(doc, signatureBytes, "signature.png");
                            float sigW = 80;
                            float sigH = 20;
                            cs.drawImage(sigImage, textCenterX - sigW / 2, textY - sigH, sigW, sigH);
                        } catch (Exception e) {
                            log.debug("Could not embed signature image: {}", e.getMessage());
                        }
                    }
                    return;
                } catch (Exception e) {
                    log.warn("Failed to embed stamp image, falling back to text stamp: {}", e.getMessage());
                }
            }

            // Fallback: draw text-based stamp if no stamp image
            float bx = pageWidth - 180;
            float by = 30;
            float bw = 160;
            float bh = 80;
            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

            cs.setLineWidth(1.5f);
            cs.addRect(bx, by, bw, bh);
            cs.stroke();
            cs.setLineWidth(0.5f);
            cs.addRect(bx + 3, by + 3, bw - 6, bh - 6);
            cs.stroke();

            float nameWidth = fontBold.getStringWidth(stampName) / 1000 * 10;
            cs.beginText();
            cs.setFont(fontBold, 10);
            cs.newLineAtOffset(bx + (bw - nameWidth) / 2, by + bh - 18);
            cs.showText(stampName);
            cs.endText();

            cs.setLineWidth(0.5f);
            cs.moveTo(bx + 10, by + bh - 22);
            cs.lineTo(bx + bw - 10, by + bh - 22);
            cs.stroke();

            cs.beginText();
            cs.setFont(fontNormal, 7);
            float dateWidth = fontNormal.getStringWidth("Date: " + dateStr) / 1000 * 7;
            cs.newLineAtOffset(bx + (bw - dateWidth) / 2, by + bh - 35);
            cs.showText("Date: " + dateStr);
            cs.endText();

            cs.beginText();
            cs.setFont(fontNormal, 7);
            String byLine = "By: " + approverName;
            float byWidth = fontNormal.getStringWidth(byLine) / 1000 * 7;
            cs.newLineAtOffset(bx + (bw - byWidth) / 2, by + bh - 47);
            cs.showText(byLine);
            cs.endText();

            if (signatureBytes != null) {
                try {
                    PDImageXObject sigImage = PDImageXObject.createFromByteArray(doc, signatureBytes, "signature.png");
                    cs.drawImage(sigImage, bx + (bw - 100) / 2, by + 5, 100, 25);
                } catch (Exception e) {
                    log.debug("Could not embed signature image: {}", e.getMessage());
                    drawSignaturePlaceholder(cs, bx, by, bw, fontNormal, rgb);
                }
            } else {
                drawSignaturePlaceholder(cs, bx, by, bw, fontNormal, rgb);
            }
        }
    }

    private void drawSignaturePlaceholder(PDPageContentStream cs, float bx, float by, float bw,
                                           PDType1Font font, float[] rgb) throws Exception {
        cs.setStrokingColor(rgb[0], rgb[1], rgb[2]);
        cs.setLineDashPattern(new float[]{3, 2}, 0);
        cs.moveTo(bx + 25, by + 15);
        cs.lineTo(bx + bw - 25, by + 15);
        cs.stroke();
        cs.setLineDashPattern(new float[]{}, 0);

        cs.beginText();
        cs.setFont(font, 6);
        cs.setNonStrokingColor(rgb[0], rgb[1], rgb[2]);
        float tw = font.getStringWidth("Signature") / 1000 * 6;
        cs.newLineAtOffset(bx + (bw - tw) / 2, by + 5);
        cs.showText("Signature");
        cs.endText();
    }

    private float[] hexToRgb(String hex) {
        hex = hex.replace("#", "");
        if (hex.length() != 6) return new float[]{0.78f, 0.16f, 0.16f}; // default red
        int r = Integer.parseInt(hex.substring(0, 2), 16);
        int g = Integer.parseInt(hex.substring(2, 4), 16);
        int b = Integer.parseInt(hex.substring(4, 6), 16);
        return new float[]{r / 255f, g / 255f, b / 255f};
    }

    /**
     * Renders SVG content to PNG bytes. Handles circles, text, lines, paths, and rects.
     * Used for both stamp seals and signature SVGs.
     */
    private byte[] renderSvgToPng(String svgContent) {
        try {
            int width = 300, height = 300;

            // Parse viewBox dimensions
            var vbMatch = java.util.regex.Pattern.compile("viewBox=[\"']([^\"']+)[\"']").matcher(svgContent);
            if (vbMatch.find()) {
                String[] parts = vbMatch.group(1).trim().split("\\s+");
                if (parts.length == 4) {
                    width = Math.max(1, (int) Float.parseFloat(parts[2]));
                    height = Math.max(1, (int) Float.parseFloat(parts[3]));
                }
            }

            // Scale up for quality
            int scale = 3;
            BufferedImage img = new BufferedImage(width * scale, height * scale, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2d = img.createGraphics();
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
            g2d.scale(scale, scale);

            // Default color for 'currentColor' references
            Color defaultColor = new Color(0xc6, 0x28, 0x28); // default stamp red

            // Render circle elements
            var circlePattern = java.util.regex.Pattern.compile("<circle\\s+([^>]+)/?>", java.util.regex.Pattern.DOTALL);
            var circleMatcher = circlePattern.matcher(svgContent);
            while (circleMatcher.find()) {
                String attrs = circleMatcher.group(1);
                float cx = parseAttrFloat(attrs, "cx", 0);
                float cy = parseAttrFloat(attrs, "cy", 0);
                float r = parseAttrFloat(attrs, "r", 0);
                float sw = parseAttrFloat(attrs, "stroke-width", 2);
                Color stroke = parseAttrColor(attrs, "stroke", defaultColor);
                Color fill = parseAttrColor(attrs, "fill", null);
                String fillStr = parseAttrString(attrs, "fill");

                if (fill != null && !"none".equals(fillStr)) {
                    g2d.setColor(fill);
                    g2d.fill(new java.awt.geom.Ellipse2D.Float(cx - r, cy - r, r * 2, r * 2));
                }
                if (stroke != null) {
                    g2d.setColor(stroke);
                    g2d.setStroke(new BasicStroke(sw));
                    g2d.draw(new java.awt.geom.Ellipse2D.Float(cx - r, cy - r, r * 2, r * 2));
                }
            }

            // Render line elements
            var linePattern = java.util.regex.Pattern.compile("<line\\s+([^>]+)/?>", java.util.regex.Pattern.DOTALL);
            var lineMatcher = linePattern.matcher(svgContent);
            while (lineMatcher.find()) {
                String attrs = lineMatcher.group(1);
                float x1 = parseAttrFloat(attrs, "x1", 0);
                float y1 = parseAttrFloat(attrs, "y1", 0);
                float x2 = parseAttrFloat(attrs, "x2", 0);
                float y2 = parseAttrFloat(attrs, "y2", 0);
                float sw = parseAttrFloat(attrs, "stroke-width", 1);
                Color stroke = parseAttrColor(attrs, "stroke", defaultColor);

                g2d.setColor(stroke);
                g2d.setStroke(new BasicStroke(sw));
                g2d.draw(new java.awt.geom.Line2D.Float(x1, y1, x2, y2));
            }

            // Render text elements
            var textPattern = java.util.regex.Pattern.compile("<text\\s+([^>]*)>([^<]*)</text>");
            var textMatcher = textPattern.matcher(svgContent);
            while (textMatcher.find()) {
                String attrs = textMatcher.group(1);
                String text = textMatcher.group(2).trim();
                // Decode HTML entities
                text = text.replace("&#x2605;", "\u2605").replace("&amp;", "&");

                float x = parseAttrFloat(attrs, "x", 0);
                float y = parseAttrFloat(attrs, "y", 0);
                float fontSize = parseAttrFloat(attrs, "font-size", 12);
                Color fill = parseAttrColor(attrs, "fill", defaultColor);
                boolean bold = attrs.contains("bold");
                String anchor = parseAttrString(attrs, "text-anchor");

                int style = bold ? Font.BOLD : Font.PLAIN;
                g2d.setFont(new Font("Serif", style, (int) fontSize));
                g2d.setColor(fill);
                FontMetrics fm = g2d.getFontMetrics();

                float textX = x;
                if ("middle".equals(anchor)) {
                    textX = x - fm.stringWidth(text) / 2f;
                } else if ("end".equals(anchor)) {
                    textX = x - fm.stringWidth(text);
                }
                g2d.drawString(text, textX, y);
            }

            // Render path elements (for signatures)
            var pathPattern = java.util.regex.Pattern.compile("<path\\s+([^>]*)/?>");
            var pathMatcher = pathPattern.matcher(svgContent);
            while (pathMatcher.find()) {
                String attrs = pathMatcher.group(1);
                String d = parseAttrString(attrs, "d");
                float sw = parseAttrFloat(attrs, "stroke-width", 2.5f);
                Color stroke = parseAttrColor(attrs, "stroke", defaultColor);

                if (d != null) {
                    Path2D.Float path = parseSvgPath(d);
                    if (path != null) {
                        g2d.setColor(stroke);
                        g2d.setStroke(new BasicStroke(sw, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
                        g2d.draw(path);
                    }
                }
            }

            g2d.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.warn("Failed to render SVG to PNG: {}", e.getMessage());
            return null;
        }
    }

    private String parseAttrString(String attrs, String name) {
        var m = java.util.regex.Pattern.compile(name + "=[\"']([^\"']*)[\"']").matcher(attrs);
        return m.find() ? m.group(1) : null;
    }

    private float parseAttrFloat(String attrs, String name, float defaultVal) {
        String val = parseAttrString(attrs, name);
        if (val == null) return defaultVal;
        try { return Float.parseFloat(val); } catch (Exception e) { return defaultVal; }
    }

    private Color parseAttrColor(String attrs, String name, Color defaultColor) {
        String val = parseAttrString(attrs, name);
        if (val == null || "none".equals(val)) return "fill".equals(name) ? null : defaultColor;
        if ("currentColor".equals(val)) return defaultColor;
        if (val.startsWith("#") && val.length() == 7) {
            try { return Color.decode(val); } catch (Exception e) { return defaultColor; }
        }
        return defaultColor;
    }

    /**
     * Parses SVG path data (M, L, Q, C commands) into a Java2D Path.
     */
    private Path2D.Float parseSvgPath(String d) {
        if (d == null || d.isBlank()) return null;
        Path2D.Float path = new Path2D.Float();
        boolean started = false;

        String[] tokens = d.split("(?=[MLQCZmlqcz])");
        for (String token : tokens) {
            token = token.trim();
            if (token.isEmpty()) continue;

            char cmd = token.charAt(0);
            String coords = token.substring(1).trim();
            if (coords.isEmpty() && cmd != 'Z' && cmd != 'z') continue;

            String[] parts = coords.split("[,\\s]+");

            try {
                switch (cmd) {
                    case 'M':
                        if (parts.length >= 2) {
                            path.moveTo(Float.parseFloat(parts[0]), Float.parseFloat(parts[1]));
                            started = true;
                        }
                        break;
                    case 'L':
                        if (started && parts.length >= 2)
                            path.lineTo(Float.parseFloat(parts[0]), Float.parseFloat(parts[1]));
                        break;
                    case 'Q':
                        if (started && parts.length >= 4)
                            path.quadTo(Float.parseFloat(parts[0]), Float.parseFloat(parts[1]),
                                    Float.parseFloat(parts[2]), Float.parseFloat(parts[3]));
                        break;
                    case 'C':
                        if (started && parts.length >= 6)
                            path.curveTo(Float.parseFloat(parts[0]), Float.parseFloat(parts[1]),
                                    Float.parseFloat(parts[2]), Float.parseFloat(parts[3]),
                                    Float.parseFloat(parts[4]), Float.parseFloat(parts[5]));
                        break;
                    case 'Z': case 'z':
                        if (started) path.closePath();
                        break;
                }
            } catch (NumberFormatException ignored) {}
        }
        return started ? path : null;
    }
}
