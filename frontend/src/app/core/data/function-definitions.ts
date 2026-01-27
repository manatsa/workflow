export interface FunctionParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface FunctionExample {
  usage: string;
  result: string;
  description?: string;
}

export interface FunctionDefinition {
  name: string;
  syntax: string;
  category: string;
  description: string;
  explanation: string;
  examples: FunctionExample[];
  parameters?: FunctionParameter[];
  tips?: string[];
  troubleshooting?: string[];
  relatedFunctions?: string[];
}

export const FUNCTION_DEFINITIONS: Record<string, FunctionDefinition> = {
  // ==================== STRING FUNCTIONS ====================
  'UPPER': {
    name: 'UPPER',
    syntax: 'UPPER(field)',
    category: 'String',
    description: 'Convert text to uppercase',
    explanation: 'The UPPER function converts all characters in a text string to uppercase letters. This is useful for standardizing data entry or display formatting.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to convert to uppercase', required: true }
    ],
    examples: [
      { usage: 'UPPER(@{name})', result: '"JOHN DOE"', description: 'Convert name to uppercase' },
      { usage: 'UPPER("hello world")', result: '"HELLO WORLD"', description: 'Literal string conversion' }
    ],
    tips: [
      'Useful for standardizing codes and identifiers',
      'Does not affect non-alphabetic characters'
    ],
    relatedFunctions: ['LOWER', 'CAPITALIZE', 'TITLE_CASE']
  },

  'LOWER': {
    name: 'LOWER',
    syntax: 'LOWER(field)',
    category: 'String',
    description: 'Convert text to lowercase',
    explanation: 'The LOWER function converts all characters in a text string to lowercase letters.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to convert to lowercase', required: true }
    ],
    examples: [
      { usage: 'LOWER(@{email})', result: '"john@example.com"', description: 'Normalize email address' },
      { usage: 'LOWER("HELLO")', result: '"hello"', description: 'Literal string conversion' }
    ],
    tips: [
      'Useful for email addresses and case-insensitive comparisons',
      'Combine with TRIM() for clean input'
    ],
    relatedFunctions: ['UPPER', 'CAPITALIZE', 'TITLE_CASE']
  },

  'TRIM': {
    name: 'TRIM',
    syntax: 'TRIM(field)',
    category: 'String',
    description: 'Remove leading/trailing spaces',
    explanation: 'The TRIM function removes whitespace characters from the beginning and end of a text string. This is essential for cleaning user input.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to trim', required: true }
    ],
    examples: [
      { usage: 'TRIM(@{name})', result: '"John"', description: 'Remove surrounding spaces' },
      { usage: 'TRIM("  hello  ")', result: '"hello"', description: 'Clean whitespace' }
    ],
    tips: [
      'Use on all user input fields to prevent whitespace issues',
      'Does not remove spaces between words'
    ],
    relatedFunctions: ['LTRIM', 'RTRIM', 'IS_BLANK']
  },

  'CONCAT': {
    name: 'CONCAT',
    syntax: 'CONCAT(a, b, ...)',
    category: 'String',
    description: 'Join two or more text values',
    explanation: 'The CONCAT function joins multiple text values together into a single string. Empty or null values are treated as empty strings.',
    parameters: [
      { name: 'a', type: 'string', description: 'First text value', required: true },
      { name: 'b', type: 'string', description: 'Second text value', required: true }
    ],
    examples: [
      { usage: 'CONCAT(@{firstName}, " ", @{lastName})', result: '"John Doe"', description: 'Full name' },
      { usage: 'CONCAT("Invoice #", @{invoiceNumber})', result: '"Invoice #12345"', description: 'Prefix with text' }
    ],
    tips: [
      'Use CONCAT_WS for joining with a consistent separator',
      'Can accept multiple arguments'
    ],
    relatedFunctions: ['CONCAT_WS', 'JOIN', 'TEMPLATE']
  },

  'CONCAT_WS': {
    name: 'CONCAT_WS',
    syntax: 'CONCAT_WS(separator, a, b, ...)',
    category: 'String',
    description: 'Join with separator',
    explanation: 'CONCAT_WS (Concatenate With Separator) joins multiple values with a specified separator between each value. Empty values are skipped.',
    parameters: [
      { name: 'separator', type: 'string', description: 'Separator to use between values', required: true },
      { name: 'a', type: 'string', description: 'First value', required: true },
      { name: 'b', type: 'string', description: 'Second value', required: true }
    ],
    examples: [
      { usage: 'CONCAT_WS("-", @{year}, @{month}, @{day})', result: '"2024-12-25"', description: 'Date parts' },
      { usage: 'CONCAT_WS(", ", @{city}, @{state}, @{country})', result: '"New York, NY, USA"', description: 'Address parts' }
    ],
    tips: [
      'Empty/null values are automatically skipped',
      'Cleaner than manual CONCAT with separators'
    ],
    relatedFunctions: ['CONCAT', 'JOIN', 'SPLIT']
  },

  'LENGTH': {
    name: 'LENGTH',
    syntax: 'LENGTH(field)',
    category: 'String',
    description: 'Get text length',
    explanation: 'The LENGTH function returns the number of characters in a text string, including spaces.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to measure', required: true }
    ],
    examples: [
      { usage: 'LENGTH(@{code})', result: '6', description: 'Get code length' },
      { usage: 'LENGTH("Hello")', result: '5', description: 'Literal string length' }
    ],
    tips: [
      'Use in validation: ValidWhen(LENGTH(@{code}) == 6)',
      'Includes spaces in count'
    ],
    relatedFunctions: ['LEFT', 'RIGHT', 'SUBSTRING']
  },

  'LEFT': {
    name: 'LEFT',
    syntax: 'LEFT(field, n)',
    category: 'String',
    description: 'Get first n characters',
    explanation: 'The LEFT function extracts the specified number of characters from the beginning of a text string.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to extract from', required: true },
      { name: 'n', type: 'number', description: 'Number of characters to extract', required: true }
    ],
    examples: [
      { usage: 'LEFT(@{code}, 3)', result: '"ABC"', description: 'First 3 characters of "ABC123"' },
      { usage: 'LEFT(@{phone}, 3)', result: '"555"', description: 'Area code from phone' }
    ],
    tips: [
      'Returns entire string if n exceeds string length',
      'Use for extracting prefixes'
    ],
    relatedFunctions: ['RIGHT', 'SUBSTRING', 'LENGTH']
  },

  'RIGHT': {
    name: 'RIGHT',
    syntax: 'RIGHT(field, n)',
    category: 'String',
    description: 'Get last n characters',
    explanation: 'The RIGHT function extracts the specified number of characters from the end of a text string.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to extract from', required: true },
      { name: 'n', type: 'number', description: 'Number of characters to extract', required: true }
    ],
    examples: [
      { usage: 'RIGHT(@{code}, 3)', result: '"123"', description: 'Last 3 characters of "ABC123"' },
      { usage: 'RIGHT(@{ssn}, 4)', result: '"1234"', description: 'Last 4 digits of SSN' }
    ],
    tips: [
      'Useful for extracting suffixes or last digits',
      'Returns entire string if n exceeds string length'
    ],
    relatedFunctions: ['LEFT', 'SUBSTRING', 'LENGTH']
  },

  'SUBSTRING': {
    name: 'SUBSTRING',
    syntax: 'SUBSTRING(field, start, length)',
    category: 'String',
    description: 'Extract part of text',
    explanation: 'The SUBSTRING function extracts a portion of text starting at a specified position for a specified length. Position is 1-based (first character is position 1).',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to extract from', required: true },
      { name: 'start', type: 'number', description: 'Starting position (1-based)', required: true },
      { name: 'length', type: 'number', description: 'Number of characters to extract', required: true }
    ],
    examples: [
      { usage: 'SUBSTRING(@{code}, 1, 3)', result: '"ABC"', description: 'First 3 chars of "ABCDEF"' },
      { usage: 'SUBSTRING(@{date}, 6, 2)', result: '"12"', description: 'Month from "2024-12-25"' }
    ],
    tips: [
      'Position starts at 1, not 0',
      'If length exceeds remaining characters, returns to end of string'
    ],
    relatedFunctions: ['LEFT', 'RIGHT', 'INDEX_OF']
  },

  'REPLACE': {
    name: 'REPLACE',
    syntax: 'REPLACE(field, old, new)',
    category: 'String',
    description: 'Replace text (first occurrence)',
    explanation: 'The REPLACE function replaces the first occurrence of a specified text with new text.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to modify', required: true },
      { name: 'old', type: 'string', description: 'Text to find', required: true },
      { name: 'new', type: 'string', description: 'Replacement text', required: true }
    ],
    examples: [
      { usage: 'REPLACE(@{text}, "old", "new")', result: 'Replaces first "old"', description: 'Simple replacement' },
      { usage: 'REPLACE(@{phone}, "-", "")', result: 'Removes first dash', description: 'Remove character' }
    ],
    tips: [
      'Only replaces first occurrence',
      'Use REPLACE_ALL to replace all occurrences'
    ],
    relatedFunctions: ['REPLACE_ALL', 'REGEX_REPLACE']
  },

  'REPLACE_ALL': {
    name: 'REPLACE_ALL',
    syntax: 'REPLACE_ALL(field, old, new)',
    category: 'String',
    description: 'Replace all occurrences',
    explanation: 'The REPLACE_ALL function replaces all occurrences of a specified text with new text.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to modify', required: true },
      { name: 'old', type: 'string', description: 'Text to find', required: true },
      { name: 'new', type: 'string', description: 'Replacement text', required: true }
    ],
    examples: [
      { usage: 'REPLACE_ALL(@{phone}, "-", "")', result: '"5551234567"', description: 'Remove all dashes from "555-123-4567"' },
      { usage: 'REPLACE_ALL(@{text}, " ", "_")', result: 'Spaces to underscores', description: 'Replace all spaces' }
    ],
    tips: [
      'Use for consistent replacements across entire string',
      'For pattern-based replacement, use REGEX_REPLACE'
    ],
    relatedFunctions: ['REPLACE', 'REGEX_REPLACE']
  },

  'CONTAINS': {
    name: 'CONTAINS',
    syntax: 'CONTAINS(field, text)',
    category: 'String',
    description: 'Check if text contains value',
    explanation: 'The CONTAINS function checks if a text string contains a specified substring, returning true or false. The check is case-sensitive.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to search in', required: true },
      { name: 'text', type: 'string', description: 'Substring to find', required: true }
    ],
    examples: [
      { usage: 'CONTAINS(@{email}, "@gmail.com")', result: 'true/false', description: 'Check email domain' },
      { usage: 'CONTAINS(@{description}, "urgent")', result: 'true/false', description: 'Find keyword' }
    ],
    tips: [
      'Case-sensitive - use LOWER() for case-insensitive check',
      'Use in VisibleWhen conditions'
    ],
    relatedFunctions: ['STARTS_WITH', 'ENDS_WITH', 'INDEX_OF']
  },

  'STARTS_WITH': {
    name: 'STARTS_WITH',
    syntax: 'STARTS_WITH(field, text)',
    category: 'String',
    description: 'Check if text starts with value',
    explanation: 'The STARTS_WITH function checks if a text string begins with a specified prefix.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to check', required: true },
      { name: 'text', type: 'string', description: 'Prefix to find', required: true }
    ],
    examples: [
      { usage: 'STARTS_WITH(@{code}, "INV")', result: 'true/false', description: 'Check invoice code prefix' },
      { usage: 'STARTS_WITH(@{phone}, "+1")', result: 'true/false', description: 'Check country code' }
    ],
    relatedFunctions: ['ENDS_WITH', 'CONTAINS', 'LEFT']
  },

  'ENDS_WITH': {
    name: 'ENDS_WITH',
    syntax: 'ENDS_WITH(field, text)',
    category: 'String',
    description: 'Check if text ends with value',
    explanation: 'The ENDS_WITH function checks if a text string ends with a specified suffix.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to check', required: true },
      { name: 'text', type: 'string', description: 'Suffix to find', required: true }
    ],
    examples: [
      { usage: 'ENDS_WITH(@{email}, ".edu")', result: 'true/false', description: 'Check education email' },
      { usage: 'ENDS_WITH(@{filename}, ".pdf")', result: 'true/false', description: 'Check file extension' }
    ],
    relatedFunctions: ['STARTS_WITH', 'CONTAINS', 'RIGHT']
  },

  'LTRIM': {
    name: 'LTRIM',
    syntax: 'LTRIM(field)',
    category: 'String',
    description: 'Remove leading spaces',
    explanation: 'The LTRIM function removes whitespace characters from the beginning (left side) of a text string.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to trim', required: true }
    ],
    examples: [
      { usage: 'LTRIM(@{name})', result: '"John  "', description: 'Remove leading spaces from "  John  "' },
      { usage: 'LTRIM("   hello")', result: '"hello"', description: 'Clean leading whitespace' }
    ],
    tips: [
      'Only removes spaces from the left/beginning',
      'Use TRIM() to remove from both sides'
    ],
    relatedFunctions: ['RTRIM', 'TRIM']
  },

  'RTRIM': {
    name: 'RTRIM',
    syntax: 'RTRIM(field)',
    category: 'String',
    description: 'Remove trailing spaces',
    explanation: 'The RTRIM function removes whitespace characters from the end (right side) of a text string.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to trim', required: true }
    ],
    examples: [
      { usage: 'RTRIM(@{name})', result: '"  John"', description: 'Remove trailing spaces from "  John  "' },
      { usage: 'RTRIM("hello   ")', result: '"hello"', description: 'Clean trailing whitespace' }
    ],
    tips: [
      'Only removes spaces from the right/end',
      'Use TRIM() to remove from both sides'
    ],
    relatedFunctions: ['LTRIM', 'TRIM']
  },

  'REVERSE': {
    name: 'REVERSE',
    syntax: 'REVERSE(field)',
    category: 'String',
    description: 'Reverse text string',
    explanation: 'The REVERSE function reverses all characters in a text string.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to reverse', required: true }
    ],
    examples: [
      { usage: 'REVERSE(@{code})', result: '"CBA"', description: 'Reverse "ABC"' },
      { usage: 'REVERSE("Hello")', result: '"olleH"', description: 'Reverse greeting' }
    ],
    tips: [
      'Useful for palindrome checks',
      'Works with any characters including numbers'
    ],
    relatedFunctions: ['LEFT', 'RIGHT', 'SUBSTRING']
  },

  'REPEAT': {
    name: 'REPEAT',
    syntax: 'REPEAT(field, n)',
    category: 'String',
    description: 'Repeat text n times',
    explanation: 'The REPEAT function repeats a text string a specified number of times.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text to repeat', required: true },
      { name: 'n', type: 'number', description: 'Number of times to repeat', required: true }
    ],
    examples: [
      { usage: 'REPEAT("*", 5)', result: '"*****"', description: 'Create star rating' },
      { usage: 'REPEAT(@{char}, 3)', result: 'Text repeated 3 times', description: 'Repeat field value' }
    ],
    tips: [
      'Useful for creating patterns or visual separators',
      'Returns empty string if n is 0 or negative'
    ],
    relatedFunctions: ['CONCAT', 'PAD_LEFT', 'PAD_RIGHT']
  },

  'PAD_LEFT': {
    name: 'PAD_LEFT',
    syntax: 'PAD_LEFT(field, length, char)',
    category: 'String',
    description: 'Pad text on left',
    explanation: 'The PAD_LEFT function pads a text string on the left side to reach a specified length using a specified character.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text to pad', required: true },
      { name: 'length', type: 'number', description: 'Desired total length', required: true },
      { name: 'char', type: 'string', description: 'Character to pad with', required: true }
    ],
    examples: [
      { usage: 'PAD_LEFT(@{id}, 6, "0")', result: '"000123"', description: 'Pad ID to 6 digits' },
      { usage: 'PAD_LEFT("42", 5, "0")', result: '"00042"', description: 'Zero-pad number' }
    ],
    tips: [
      'Commonly used for formatting numbers with leading zeros',
      'If string is already at or exceeds length, returns unchanged'
    ],
    relatedFunctions: ['PAD_RIGHT', 'LEFT', 'FORMAT_NUMBER']
  },

  'PAD_RIGHT': {
    name: 'PAD_RIGHT',
    syntax: 'PAD_RIGHT(field, length, char)',
    category: 'String',
    description: 'Pad text on right',
    explanation: 'The PAD_RIGHT function pads a text string on the right side to reach a specified length using a specified character.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text to pad', required: true },
      { name: 'length', type: 'number', description: 'Desired total length', required: true },
      { name: 'char', type: 'string', description: 'Character to pad with', required: true }
    ],
    examples: [
      { usage: 'PAD_RIGHT(@{name}, 20, " ")', result: '"John                "', description: 'Pad name to 20 chars' },
      { usage: 'PAD_RIGHT("ABC", 6, ".")', result: '"ABC..."', description: 'Add trailing dots' }
    ],
    tips: [
      'Useful for fixed-width formatting',
      'If string is already at or exceeds length, returns unchanged'
    ],
    relatedFunctions: ['PAD_LEFT', 'RIGHT', 'CONCAT']
  },

  'CAPITALIZE': {
    name: 'CAPITALIZE',
    syntax: 'CAPITALIZE(field)',
    category: 'String',
    description: 'Capitalize first letter',
    explanation: 'The CAPITALIZE function converts the first character of a text string to uppercase and the rest to lowercase. This is useful for standardizing names or text that should have sentence case.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to capitalize', required: true }
    ],
    examples: [
      { usage: 'CAPITALIZE(@{name})', result: '"John"', description: 'Capitalize "john" or "JOHN"' },
      { usage: 'CAPITALIZE("hello world")', result: '"Hello world"', description: 'First letter only' },
      { usage: 'CAPITALIZE(@{status})', result: '"Active"', description: 'Standardize status text' }
    ],
    tips: [
      'Only capitalizes the first character of the entire string',
      'Use TITLE_CASE to capitalize each word',
      'Converts remaining characters to lowercase'
    ],
    troubleshooting: [
      'If nothing appears capitalized, check that the field contains text',
      'For multiple words, use TITLE_CASE instead'
    ],
    relatedFunctions: ['TITLE_CASE', 'UPPER', 'LOWER']
  },

  'TITLE_CASE': {
    name: 'TITLE_CASE',
    syntax: 'TITLE_CASE(field)',
    category: 'String',
    description: 'Title case all words',
    explanation: 'The TITLE_CASE function capitalizes the first letter of each word in a text string. This is useful for formatting names, titles, and headings.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text field to convert', required: true }
    ],
    examples: [
      { usage: 'TITLE_CASE(@{fullName})', result: '"John Doe"', description: 'Format full name' },
      { usage: 'TITLE_CASE("hello world")', result: '"Hello World"', description: 'Title case text' },
      { usage: 'TITLE_CASE(@{title})', result: '"The Quick Brown Fox"', description: 'Format title' }
    ],
    tips: [
      'Capitalizes first letter of every word',
      'Use CAPITALIZE for sentence case (first word only)',
      'Words are separated by spaces'
    ],
    relatedFunctions: ['CAPITALIZE', 'UPPER', 'LOWER']
  },

  'SPLIT': {
    name: 'SPLIT',
    syntax: 'SPLIT(field, separator)',
    category: 'String',
    description: 'Split text by separator',
    explanation: 'The SPLIT function divides a text string into an array of substrings using a specified separator.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text to split', required: true },
      { name: 'separator', type: 'string', description: 'Separator to split on', required: true }
    ],
    examples: [
      { usage: 'SPLIT(@{tags}, ",")', result: '["red", "blue", "green"]', description: 'Split comma list' },
      { usage: 'SPLIT("a-b-c", "-")', result: '["a", "b", "c"]', description: 'Split by dash' }
    ],
    tips: [
      'Returns an array of strings',
      'Use with ARRAY_LENGTH to count parts',
      'Use JOIN to reassemble'
    ],
    relatedFunctions: ['JOIN', 'CONCAT_WS', 'ARRAY_LENGTH']
  },

  'JOIN': {
    name: 'JOIN',
    syntax: 'JOIN(array, separator)',
    category: 'String',
    description: 'Join array with separator',
    explanation: 'The JOIN function combines array elements into a single string with a specified separator between each element.',
    parameters: [
      { name: 'array', type: 'array', description: 'Array to join', required: true },
      { name: 'separator', type: 'string', description: 'Separator between elements', required: true }
    ],
    examples: [
      { usage: 'JOIN(@{items}, ", ")', result: '"apple, banana, cherry"', description: 'Join with comma' },
      { usage: 'JOIN(["A", "B", "C"], "-")', result: '"A-B-C"', description: 'Join with dash' }
    ],
    tips: [
      'Opposite of SPLIT function',
      'Empty array returns empty string',
      'Null elements are typically converted to empty strings'
    ],
    relatedFunctions: ['SPLIT', 'CONCAT', 'CONCAT_WS']
  },

  'INDEX_OF': {
    name: 'INDEX_OF',
    syntax: 'INDEX_OF(field, text)',
    category: 'String',
    description: 'Find position of text',
    explanation: 'The INDEX_OF function returns the position of the first occurrence of a substring within a text string. Returns -1 if not found. Position is 0-based.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text to search in', required: true },
      { name: 'text', type: 'string', description: 'Substring to find', required: true }
    ],
    examples: [
      { usage: 'INDEX_OF(@{email}, "@")', result: '4', description: 'Find @ in "john@example.com"' },
      { usage: 'INDEX_OF("Hello World", "World")', result: '6', description: 'Find word position' }
    ],
    tips: [
      'Returns -1 if substring not found',
      'Position is 0-based (first character is 0)',
      'Case-sensitive search'
    ],
    relatedFunctions: ['CONTAINS', 'SUBSTRING', 'LEFT']
  },

  'REGEX_MATCH': {
    name: 'REGEX_MATCH',
    syntax: 'REGEX_MATCH(field, pattern)',
    category: 'String',
    description: 'Match regex pattern',
    explanation: 'The REGEX_MATCH function checks if a text string matches a regular expression pattern. Returns true if the pattern matches anywhere in the string.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text to match against', required: true },
      { name: 'pattern', type: 'string', description: 'Regular expression pattern', required: true }
    ],
    examples: [
      { usage: 'REGEX_MATCH(@{phone}, "^\\\\d{10}$")', result: 'true/false', description: 'Validate 10-digit phone' },
      { usage: 'REGEX_MATCH(@{code}, "^[A-Z]{3}\\\\d{3}$")', result: 'true/false', description: 'Match code format' }
    ],
    tips: [
      'Escape backslashes (use \\\\ instead of \\)',
      'Use ^ and $ for full string match',
      'Test patterns before using in production'
    ],
    troubleshooting: [
      'Pattern not matching? Check backslash escaping',
      'Use online regex testers to validate patterns'
    ],
    relatedFunctions: ['REGEX_REPLACE', 'CONTAINS', 'RegexWhen']
  },

  'REGEX_REPLACE': {
    name: 'REGEX_REPLACE',
    syntax: 'REGEX_REPLACE(field, pattern, replacement)',
    category: 'String',
    description: 'Replace with regex',
    explanation: 'The REGEX_REPLACE function replaces all occurrences of a regular expression pattern with a replacement string.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text to modify', required: true },
      { name: 'pattern', type: 'string', description: 'Regular expression pattern', required: true },
      { name: 'replacement', type: 'string', description: 'Replacement text', required: true }
    ],
    examples: [
      { usage: 'REGEX_REPLACE(@{phone}, "\\\\D", "")', result: '"5551234567"', description: 'Remove non-digits' },
      { usage: 'REGEX_REPLACE(@{text}, "\\\\s+", " ")', result: 'Normalize spaces', description: 'Single spaces' }
    ],
    tips: [
      'Replaces ALL matches, not just first',
      'Escape backslashes in patterns',
      'Use capture groups with $1, $2 in replacement'
    ],
    relatedFunctions: ['REGEX_MATCH', 'REPLACE', 'REPLACE_ALL']
  },

  // ==================== NUMBER FUNCTIONS ====================
  'SUM': {
    name: 'SUM',
    syntax: 'SUM(a, b, ...)',
    category: 'Number',
    description: 'Add numbers together',
    explanation: 'The SUM function adds two or more numbers together. It ignores empty or non-numeric values.',
    parameters: [
      { name: 'values', type: 'number[]', description: 'Numbers to add together', required: true }
    ],
    examples: [
      { usage: 'SUM(@{price}, @{tax}, @{shipping})', result: 'Total of all values', description: 'Calculate total' },
      { usage: 'SUM(100, 50, 25)', result: '175', description: 'Add literal numbers' }
    ],
    tips: [
      'Non-numeric values are treated as 0',
      'Can accept multiple arguments'
    ],
    relatedFunctions: ['SUBTRACT', 'AVERAGE', 'COUNT']
  },

  'MULTIPLY': {
    name: 'MULTIPLY',
    syntax: 'MULTIPLY(a, b)',
    category: 'Number',
    description: 'Multiply numbers',
    explanation: 'The MULTIPLY function multiplies two numbers together.',
    parameters: [
      { name: 'a', type: 'number', description: 'First number', required: true },
      { name: 'b', type: 'number', description: 'Second number', required: true }
    ],
    examples: [
      { usage: 'MULTIPLY(@{quantity}, @{unitPrice})', result: 'Line total', description: 'Calculate line item total' },
      { usage: 'MULTIPLY(@{hours}, 1.5)', result: 'Overtime pay', description: 'Calculate with rate' }
    ],
    relatedFunctions: ['DIVIDE', 'SUM', 'POWER']
  },

  'DIVIDE': {
    name: 'DIVIDE',
    syntax: 'DIVIDE(a, b)',
    category: 'Number',
    description: 'Divide a by b',
    explanation: 'The DIVIDE function divides the first number by the second. Returns null/error if dividing by zero.',
    parameters: [
      { name: 'a', type: 'number', description: 'Dividend (number to divide)', required: true },
      { name: 'b', type: 'number', description: 'Divisor (number to divide by)', required: true }
    ],
    examples: [
      { usage: 'DIVIDE(@{total}, @{count})', result: 'Average', description: 'Calculate average' },
      { usage: 'DIVIDE(@{part}, @{whole})', result: 'Ratio', description: 'Calculate ratio' }
    ],
    tips: [
      'Always check for division by zero',
      'Use with PERCENTAGE for percentage calculations'
    ],
    relatedFunctions: ['MULTIPLY', 'MOD', 'PERCENTAGE']
  },

  'ROUND': {
    name: 'ROUND',
    syntax: 'ROUND(field, decimals)',
    category: 'Number',
    description: 'Round to decimal places',
    explanation: 'The ROUND function rounds a number to a specified number of decimal places using standard rounding rules (>=5 rounds up).',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to round', required: true },
      { name: 'decimals', type: 'number', description: 'Number of decimal places', required: true }
    ],
    examples: [
      { usage: 'ROUND(@{amount}, 2)', result: '123.46', description: 'Round 123.456 to 2 decimals' },
      { usage: 'ROUND(@{price}, 0)', result: '124', description: 'Round to whole number' }
    ],
    tips: [
      'Use for currency calculations',
      'decimals=0 rounds to whole number'
    ],
    relatedFunctions: ['FLOOR', 'CEIL', 'TRUNC']
  },

  'MIN': {
    name: 'MIN',
    syntax: 'MIN(a, b, ...)',
    category: 'Number',
    description: 'Get minimum value',
    explanation: 'The MIN function returns the smallest value from a set of numbers.',
    parameters: [
      { name: 'values', type: 'number[]', description: 'Numbers to compare', required: true }
    ],
    examples: [
      { usage: 'MIN(@{price1}, @{price2}, @{price3})', result: 'Lowest price', description: 'Find lowest price' },
      { usage: 'MIN(@{available}, @{requested})', result: 'Quantity to fulfill', description: 'Cap at available' }
    ],
    relatedFunctions: ['MAX', 'AVERAGE', 'CLAMP']
  },

  'MAX': {
    name: 'MAX',
    syntax: 'MAX(a, b, ...)',
    category: 'Number',
    description: 'Get maximum value',
    explanation: 'The MAX function returns the largest value from a set of numbers.',
    parameters: [
      { name: 'values', type: 'number[]', description: 'Numbers to compare', required: true }
    ],
    examples: [
      { usage: 'MAX(@{bid1}, @{bid2}, @{bid3})', result: 'Highest bid', description: 'Find highest bid' },
      { usage: 'MAX(@{value}, 0)', result: 'Non-negative value', description: 'Floor at zero' }
    ],
    relatedFunctions: ['MIN', 'AVERAGE', 'CLAMP']
  },

  'AVERAGE': {
    name: 'AVERAGE',
    syntax: 'AVERAGE(a, b, ...)',
    category: 'Number',
    description: 'Calculate average',
    explanation: 'The AVERAGE function calculates the arithmetic mean of a set of numbers.',
    parameters: [
      { name: 'values', type: 'number[]', description: 'Numbers to average', required: true }
    ],
    examples: [
      { usage: 'AVERAGE(@{score1}, @{score2}, @{score3})', result: 'Average score', description: 'Calculate average score' },
      { usage: 'AVERAGE(85, 90, 88)', result: '87.67', description: 'Literal average' }
    ],
    relatedFunctions: ['SUM', 'MEDIAN', 'COUNT']
  },

  'PERCENTAGE': {
    name: 'PERCENTAGE',
    syntax: 'PERCENTAGE(value, total)',
    category: 'Number',
    description: 'Calculate percentage',
    explanation: 'The PERCENTAGE function calculates what percentage one value is of another (value/total * 100).',
    parameters: [
      { name: 'value', type: 'number', description: 'Part value', required: true },
      { name: 'total', type: 'number', description: 'Whole value', required: true }
    ],
    examples: [
      { usage: 'PERCENTAGE(@{completed}, @{total})', result: '75', description: '75% completion (15/20)' },
      { usage: 'PERCENTAGE(@{sales}, @{target})', result: '120', description: '120% of target' }
    ],
    tips: [
      'Returns percentage as number (e.g., 75 not 0.75)',
      'Use FORMAT_PERCENT for display'
    ],
    relatedFunctions: ['DIVIDE', 'FORMAT_PERCENT']
  },

  'ABS': {
    name: 'ABS',
    syntax: 'ABS(field)',
    category: 'Number',
    description: 'Get absolute value',
    explanation: 'The ABS function returns the absolute (positive) value of a number.',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to get absolute value of', required: true }
    ],
    examples: [
      { usage: 'ABS(@{difference})', result: '50', description: 'Absolute of -50' },
      { usage: 'ABS(@{balance})', result: 'Always positive', description: 'Make balance positive' }
    ],
    relatedFunctions: ['SIGN', 'CLAMP']
  },

  'CLAMP': {
    name: 'CLAMP',
    syntax: 'CLAMP(field, min, max)',
    category: 'Number',
    description: 'Limit to range',
    explanation: 'The CLAMP function constrains a value to be within a specified range. Values below min become min, values above max become max.',
    parameters: [
      { name: 'field', type: 'number', description: 'Value to constrain', required: true },
      { name: 'min', type: 'number', description: 'Minimum allowed value', required: true },
      { name: 'max', type: 'number', description: 'Maximum allowed value', required: true }
    ],
    examples: [
      { usage: 'CLAMP(@{rating}, 1, 5)', result: 'Value between 1-5', description: 'Constrain rating' },
      { usage: 'CLAMP(@{percentage}, 0, 100)', result: 'Valid percentage', description: 'Keep in 0-100 range' }
    ],
    tips: [
      'Ensures value stays within valid range',
      'Useful for validation default values'
    ],
    relatedFunctions: ['MIN', 'MAX', 'BETWEEN']
  },

  'SUBTRACT': {
    name: 'SUBTRACT',
    syntax: 'SUBTRACT(a, b)',
    category: 'Number',
    description: 'Subtract b from a',
    explanation: 'The SUBTRACT function subtracts the second number from the first number (a - b).',
    parameters: [
      { name: 'a', type: 'number', description: 'Number to subtract from', required: true },
      { name: 'b', type: 'number', description: 'Number to subtract', required: true }
    ],
    examples: [
      { usage: 'SUBTRACT(@{total}, @{discount})', result: 'Net amount', description: 'Calculate net price' },
      { usage: 'SUBTRACT(100, 25)', result: '75', description: 'Simple subtraction' }
    ],
    relatedFunctions: ['SUM', 'MULTIPLY', 'DIVIDE']
  },

  'FLOOR': {
    name: 'FLOOR',
    syntax: 'FLOOR(field)',
    category: 'Number',
    description: 'Round down to integer',
    explanation: 'The FLOOR function rounds a number down to the nearest integer (toward negative infinity).',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to round down', required: true }
    ],
    examples: [
      { usage: 'FLOOR(@{price})', result: '123', description: 'Floor of 123.9 is 123' },
      { usage: 'FLOOR(-4.3)', result: '-5', description: 'Floor of -4.3 is -5' }
    ],
    tips: [
      'Always rounds toward negative infinity',
      'FLOOR(-4.3) = -5, not -4'
    ],
    relatedFunctions: ['CEIL', 'ROUND', 'TRUNC']
  },

  'CEIL': {
    name: 'CEIL',
    syntax: 'CEIL(field)',
    category: 'Number',
    description: 'Round up to integer',
    explanation: 'The CEIL (ceiling) function rounds a number up to the nearest integer (toward positive infinity).',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to round up', required: true }
    ],
    examples: [
      { usage: 'CEIL(@{quantity})', result: '124', description: 'Ceil of 123.1 is 124' },
      { usage: 'CEIL(-4.3)', result: '-4', description: 'Ceil of -4.3 is -4' }
    ],
    tips: [
      'Always rounds toward positive infinity',
      'Useful for calculating minimum required quantities'
    ],
    relatedFunctions: ['FLOOR', 'ROUND', 'TRUNC']
  },

  'TRUNC': {
    name: 'TRUNC',
    syntax: 'TRUNC(field)',
    category: 'Number',
    description: 'Truncate decimal part',
    explanation: 'The TRUNC function removes the decimal portion of a number, keeping only the integer part (truncates toward zero).',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to truncate', required: true }
    ],
    examples: [
      { usage: 'TRUNC(@{value})', result: '123', description: 'Trunc of 123.9 is 123' },
      { usage: 'TRUNC(-4.7)', result: '-4', description: 'Trunc of -4.7 is -4' }
    ],
    tips: [
      'Truncates toward zero (different from FLOOR for negatives)',
      'TRUNC(-4.7) = -4, FLOOR(-4.7) = -5'
    ],
    relatedFunctions: ['FLOOR', 'CEIL', 'ROUND']
  },

  'SIGN': {
    name: 'SIGN',
    syntax: 'SIGN(field)',
    category: 'Number',
    description: 'Get sign (-1, 0, 1)',
    explanation: 'The SIGN function returns the sign of a number: -1 for negative, 0 for zero, and 1 for positive.',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to check', required: true }
    ],
    examples: [
      { usage: 'SIGN(@{balance})', result: '-1, 0, or 1', description: 'Get balance sign' },
      { usage: 'SIGN(-42)', result: '-1', description: 'Negative number' },
      { usage: 'SIGN(100)', result: '1', description: 'Positive number' }
    ],
    tips: [
      'Useful for determining if value is positive/negative/zero',
      'Use with IF for conditional logic based on sign'
    ],
    relatedFunctions: ['ABS', 'IF']
  },

  'MEDIAN': {
    name: 'MEDIAN',
    syntax: 'MEDIAN(a, b, ...)',
    category: 'Number',
    description: 'Calculate median',
    explanation: 'The MEDIAN function returns the middle value when numbers are sorted. For even counts, it returns the average of the two middle values.',
    parameters: [
      { name: 'values', type: 'number[]', description: 'Numbers to find median of', required: true }
    ],
    examples: [
      { usage: 'MEDIAN(@{score1}, @{score2}, @{score3})', result: 'Middle value', description: 'Find median score' },
      { usage: 'MEDIAN(1, 2, 3, 4, 5)', result: '3', description: 'Median of 5 numbers' }
    ],
    tips: [
      'Less affected by outliers than AVERAGE',
      'For even count, averages two middle values'
    ],
    relatedFunctions: ['AVERAGE', 'MIN', 'MAX']
  },

  'COUNT': {
    name: 'COUNT',
    syntax: 'COUNT(a, b, ...)',
    category: 'Number',
    description: 'Count non-empty values',
    explanation: 'The COUNT function counts the number of non-empty, non-null values in a list.',
    parameters: [
      { name: 'values', type: 'any[]', description: 'Values to count', required: true }
    ],
    examples: [
      { usage: 'COUNT(@{field1}, @{field2}, @{field3})', result: '2', description: 'Count filled fields' },
      { usage: 'COUNT("a", null, "c", "")', result: '2', description: 'Only counts non-empty' }
    ],
    tips: [
      'Skips null, undefined, and empty strings',
      'Useful for determining how many fields are filled'
    ],
    relatedFunctions: ['SUM', 'AVERAGE', 'IS_EMPTY']
  },

  'MOD': {
    name: 'MOD',
    syntax: 'MOD(a, b)',
    category: 'Number',
    description: 'Get remainder of division',
    explanation: 'The MOD (modulo) function returns the remainder after dividing the first number by the second.',
    parameters: [
      { name: 'a', type: 'number', description: 'Dividend', required: true },
      { name: 'b', type: 'number', description: 'Divisor', required: true }
    ],
    examples: [
      { usage: 'MOD(@{number}, 2)', result: '0 or 1', description: 'Check even/odd' },
      { usage: 'MOD(17, 5)', result: '2', description: '17 / 5 = 3 remainder 2' }
    ],
    tips: [
      'Use MOD(n, 2) == 0 to check if even',
      'Useful for alternating patterns or cycling'
    ],
    relatedFunctions: ['DIVIDE', 'FLOOR']
  },

  'POWER': {
    name: 'POWER',
    syntax: 'POWER(base, exponent)',
    category: 'Number',
    description: 'Raise to power',
    explanation: 'The POWER function raises a number to the specified power (exponent).',
    parameters: [
      { name: 'base', type: 'number', description: 'Base number', required: true },
      { name: 'exponent', type: 'number', description: 'Power to raise to', required: true }
    ],
    examples: [
      { usage: 'POWER(@{side}, 2)', result: 'Square of side', description: 'Calculate square' },
      { usage: 'POWER(2, 10)', result: '1024', description: '2 to the 10th power' }
    ],
    tips: [
      'Use POWER(n, 2) for squaring',
      'Use POWER(n, 0.5) for square root (same as SQRT)'
    ],
    relatedFunctions: ['SQRT', 'EXP', 'LOG']
  },

  'SQRT': {
    name: 'SQRT',
    syntax: 'SQRT(field)',
    category: 'Number',
    description: 'Square root',
    explanation: 'The SQRT function returns the square root of a number.',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to get square root of', required: true }
    ],
    examples: [
      { usage: 'SQRT(@{area})', result: 'Side length', description: 'Calculate square side' },
      { usage: 'SQRT(144)', result: '12', description: 'Square root of 144' }
    ],
    tips: [
      'Returns NaN for negative numbers',
      'Equivalent to POWER(n, 0.5)'
    ],
    relatedFunctions: ['POWER', 'ABS']
  },

  'LOG': {
    name: 'LOG',
    syntax: 'LOG(field)',
    category: 'Number',
    description: 'Natural logarithm',
    explanation: 'The LOG function returns the natural logarithm (base e) of a number.',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to get logarithm of', required: true }
    ],
    examples: [
      { usage: 'LOG(@{value})', result: 'Natural log', description: 'Calculate natural log' },
      { usage: 'LOG(2.718)', result: '~1', description: 'Log of e ≈ 1' }
    ],
    tips: [
      'Returns NaN for zero or negative numbers',
      'Use LOG10 for base-10 logarithm'
    ],
    relatedFunctions: ['LOG10', 'EXP', 'POWER']
  },

  'LOG10': {
    name: 'LOG10',
    syntax: 'LOG10(field)',
    category: 'Number',
    description: 'Base 10 logarithm',
    explanation: 'The LOG10 function returns the base-10 logarithm of a number.',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to get logarithm of', required: true }
    ],
    examples: [
      { usage: 'LOG10(@{value})', result: 'Base-10 log', description: 'Calculate log base 10' },
      { usage: 'LOG10(1000)', result: '3', description: '10^3 = 1000' }
    ],
    tips: [
      'LOG10(10^n) = n',
      'Returns NaN for zero or negative numbers'
    ],
    relatedFunctions: ['LOG', 'POWER']
  },

  'EXP': {
    name: 'EXP',
    syntax: 'EXP(field)',
    category: 'Number',
    description: 'e raised to power',
    explanation: 'The EXP function returns e (Euler\'s number, approximately 2.718) raised to the specified power.',
    parameters: [
      { name: 'field', type: 'number', description: 'Exponent', required: true }
    ],
    examples: [
      { usage: 'EXP(@{rate})', result: 'e^rate', description: 'Exponential calculation' },
      { usage: 'EXP(1)', result: '2.718...', description: 'e^1 = e' }
    ],
    tips: [
      'EXP(1) ≈ 2.718 (Euler\'s number)',
      'Inverse of LOG function'
    ],
    relatedFunctions: ['LOG', 'POWER']
  },

  'IS_NUMBER': {
    name: 'IS_NUMBER',
    syntax: 'IS_NUMBER(field)',
    category: 'Number',
    description: 'Check if value is number',
    explanation: 'The IS_NUMBER function checks if a value is a valid number (not NaN, null, or non-numeric string).',
    parameters: [
      { name: 'field', type: 'any', description: 'Value to check', required: true }
    ],
    examples: [
      { usage: 'IS_NUMBER(@{input})', result: 'true/false', description: 'Validate numeric input' },
      { usage: 'IS_NUMBER("123")', result: 'true', description: 'String number is valid' },
      { usage: 'IS_NUMBER("abc")', result: 'false', description: 'Text is not number' }
    ],
    tips: [
      'Use before mathematical operations',
      'Returns true for numeric strings like "123"'
    ],
    relatedFunctions: ['TO_NUMBER', 'IS_EMPTY']
  },

  // ==================== DATE FUNCTIONS ====================
  'TODAY': {
    name: 'TODAY',
    syntax: 'TODAY()',
    category: 'Date',
    description: 'Get current date',
    explanation: 'The TODAY function returns the current date (without time component). The value is determined when the form loads or the field is evaluated.',
    parameters: [],
    examples: [
      { usage: 'TODAY()', result: '2026-01-27', description: 'Current date' },
      { usage: 'DEFAULT(@{dueDate}, DATE_ADD(TODAY(), 7, "days"))', result: 'Default to 7 days from now', description: 'Set default due date' }
    ],
    tips: [
      'Use for date comparisons and defaults',
      'Value is snapshot at evaluation time',
      'Use NOW() if you need time component'
    ],
    relatedFunctions: ['NOW', 'DATE', 'DATE_ADD']
  },

  'NOW': {
    name: 'NOW',
    syntax: 'NOW()',
    category: 'Date',
    description: 'Get current date and time',
    explanation: 'The NOW function returns the current date and time. For DATETIME fields, it returns the full timestamp. For DATE fields, only the date portion is used.',
    parameters: [],
    examples: [
      { usage: 'NOW()', result: '2026-01-27T14:30:00', description: 'Current datetime' },
      { usage: 'DEFAULT(@{submittedAt}, NOW())', result: 'Timestamp on submit', description: 'Auto-timestamp' }
    ],
    tips: [
      'Use for timestamp fields to capture submission time',
      'Value is evaluated when the form loads, not when saved'
    ],
    relatedFunctions: ['TODAY', 'DATE', 'TIME']
  },

  'DATE_ADD': {
    name: 'DATE_ADD',
    syntax: 'DATE_ADD(field, n, unit)',
    category: 'Date',
    description: 'Add time to date',
    explanation: 'The DATE_ADD function adds a specified amount of time to a date. Units can be: years, months, weeks, days, hours, minutes, seconds.',
    parameters: [
      { name: 'field', type: 'date', description: 'Starting date', required: true },
      { name: 'n', type: 'number', description: 'Amount to add', required: true },
      { name: 'unit', type: 'string', description: 'Time unit (years, months, weeks, days, hours, minutes, seconds)', required: true }
    ],
    examples: [
      { usage: 'DATE_ADD(@{startDate}, 7, "days")', result: 'Date + 7 days', description: 'Add one week' },
      { usage: 'DATE_ADD(TODAY(), 1, "months")', result: 'Next month', description: 'Add one month' },
      { usage: 'DATE_ADD(@{orderDate}, 3, "years")', result: 'Warranty end', description: 'Calculate warranty expiry' }
    ],
    tips: [
      'Use negative numbers to subtract',
      'Month addition handles varying month lengths'
    ],
    relatedFunctions: ['DATE_SUBTRACT', 'DATE_DIFF', 'ADD_BUSINESS_DAYS']
  },

  'DATE_DIFF': {
    name: 'DATE_DIFF',
    syntax: 'DATE_DIFF(a, b, unit)',
    category: 'Date',
    description: 'Difference between dates',
    explanation: 'The DATE_DIFF function calculates the difference between two dates in the specified unit.',
    parameters: [
      { name: 'a', type: 'date', description: 'First date', required: true },
      { name: 'b', type: 'date', description: 'Second date', required: true },
      { name: 'unit', type: 'string', description: 'Time unit for result (years, months, weeks, days, hours, minutes, seconds)', required: true }
    ],
    examples: [
      { usage: 'DATE_DIFF(@{endDate}, @{startDate}, "days")', result: '30', description: 'Days between dates' },
      { usage: 'DATE_DIFF(TODAY(), @{birthDate}, "years")', result: 'Age in years', description: 'Calculate age' }
    ],
    tips: [
      'Order matters - result can be negative',
      'For exact age calculation, use AGE() instead'
    ],
    relatedFunctions: ['DATE_ADD', 'DATE_SUBTRACT', 'AGE', 'BUSINESS_DAYS']
  },

  'DATE_FORMAT': {
    name: 'DATE_FORMAT',
    syntax: 'DATE_FORMAT(field, format)',
    category: 'Date',
    description: 'Format date',
    explanation: 'The DATE_FORMAT function converts a date to a formatted string. Common format tokens: YYYY (year), MM (month), DD (day), HH (hour), mm (minute), ss (second).',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to format', required: true },
      { name: 'format', type: 'string', description: 'Format pattern', required: true }
    ],
    examples: [
      { usage: 'DATE_FORMAT(@{date}, "DD/MM/YYYY")', result: '"25/12/2024"', description: 'European format' },
      { usage: 'DATE_FORMAT(@{date}, "MMMM DD, YYYY")', result: '"December 25, 2024"', description: 'Full month name' },
      { usage: 'DATE_FORMAT(@{datetime}, "YYYY-MM-DD HH:mm")', result: '"2024-12-25 14:30"', description: 'With time' }
    ],
    tips: [
      'Use YYYY for 4-digit year, YY for 2-digit',
      'Use MM for month number, MMMM for month name'
    ],
    relatedFunctions: ['DATE_PARSE', 'TO_DATE']
  },

  'YEAR': {
    name: 'YEAR',
    syntax: 'YEAR(field)',
    category: 'Date',
    description: 'Extract year from date',
    explanation: 'The YEAR function extracts the year component from a date as a 4-digit number.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to extract year from', required: true }
    ],
    examples: [
      { usage: 'YEAR(@{birthDate})', result: '1990', description: 'Birth year' },
      { usage: 'YEAR(TODAY())', result: '2026', description: 'Current year' }
    ],
    relatedFunctions: ['MONTH', 'DAY', 'QUARTER']
  },

  'MONTH': {
    name: 'MONTH',
    syntax: 'MONTH(field)',
    category: 'Date',
    description: 'Extract month from date',
    explanation: 'The MONTH function extracts the month component from a date (1-12).',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to extract month from', required: true }
    ],
    examples: [
      { usage: 'MONTH(@{date})', result: '12', description: 'December = 12' },
      { usage: 'QUARTER(DATE(2024, MONTH(@{date}), 1))', result: 'Quarter from month', description: 'Derive quarter' }
    ],
    relatedFunctions: ['YEAR', 'DAY', 'QUARTER']
  },

  'DAY': {
    name: 'DAY',
    syntax: 'DAY(field)',
    category: 'Date',
    description: 'Extract day from date',
    explanation: 'The DAY function extracts the day of month component from a date (1-31).',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to extract day from', required: true }
    ],
    examples: [
      { usage: 'DAY(@{date})', result: '25', description: 'Day of month' },
      { usage: 'IF(DAY(@{date}) == 1, "First of month", "Not first")', result: 'Check first day', description: 'First day check' }
    ],
    relatedFunctions: ['YEAR', 'MONTH', 'WEEKDAY']
  },

  'AGE': {
    name: 'AGE',
    syntax: 'AGE(birthDate)',
    category: 'Date',
    description: 'Calculate age in years',
    explanation: 'The AGE function calculates a person\'s age in complete years based on their birth date.',
    parameters: [
      { name: 'birthDate', type: 'date', description: 'Birth date to calculate age from', required: true }
    ],
    examples: [
      { usage: 'AGE(@{dateOfBirth})', result: '34', description: 'Person\'s age' },
      { usage: 'ValidWhen(AGE(@{dob}) >= 18, "Must be 18 or older")', result: 'Age validation', description: 'Minimum age check' }
    ],
    tips: [
      'Returns complete years only',
      'Handles leap years correctly'
    ],
    relatedFunctions: ['DATE_DIFF', 'YEAR']
  },

  'DATE': {
    name: 'DATE',
    syntax: 'DATE(year, month, day)',
    category: 'Date',
    description: 'Create date from parts',
    explanation: 'The DATE function creates a date from individual year, month, and day components.',
    parameters: [
      { name: 'year', type: 'number', description: 'Year (4 digits)', required: true },
      { name: 'month', type: 'number', description: 'Month (1-12)', required: true },
      { name: 'day', type: 'number', description: 'Day (1-31)', required: true }
    ],
    examples: [
      { usage: 'DATE(2024, 12, 25)', result: '2024-12-25', description: 'Christmas 2024' },
      { usage: 'DATE(YEAR(TODAY()), 1, 1)', result: 'Jan 1 of current year', description: 'Start of current year' }
    ],
    tips: [
      'Month is 1-based (January = 1)',
      'Invalid dates may roll over (e.g., Feb 30 becomes March 2)'
    ],
    relatedFunctions: ['TIME', 'TODAY', 'YEAR', 'MONTH', 'DAY']
  },

  'TIME': {
    name: 'TIME',
    syntax: 'TIME(hour, minute, second)',
    category: 'Date',
    description: 'Create time from parts',
    explanation: 'The TIME function creates a time value from individual hour, minute, and second components.',
    parameters: [
      { name: 'hour', type: 'number', description: 'Hour (0-23)', required: true },
      { name: 'minute', type: 'number', description: 'Minute (0-59)', required: true },
      { name: 'second', type: 'number', description: 'Second (0-59)', required: true }
    ],
    examples: [
      { usage: 'TIME(14, 30, 0)', result: '14:30:00', description: '2:30 PM' },
      { usage: 'TIME(9, 0, 0)', result: '09:00:00', description: '9 AM' }
    ],
    tips: [
      'Hour is 24-hour format (0-23)',
      'Second parameter is optional in some implementations'
    ],
    relatedFunctions: ['DATE', 'NOW', 'HOUR', 'MINUTE', 'SECOND']
  },

  'DATE_PARSE': {
    name: 'DATE_PARSE',
    syntax: 'DATE_PARSE(text, format)',
    category: 'Date',
    description: 'Parse date from text',
    explanation: 'The DATE_PARSE function converts a text string to a date using the specified format pattern.',
    parameters: [
      { name: 'text', type: 'string', description: 'Text containing date', required: true },
      { name: 'format', type: 'string', description: 'Format pattern of the text', required: true }
    ],
    examples: [
      { usage: 'DATE_PARSE(@{dateText}, "DD/MM/YYYY")', result: 'Date object', description: 'Parse European format' },
      { usage: 'DATE_PARSE("25-12-2024", "DD-MM-YYYY")', result: '2024-12-25', description: 'Parse with dashes' }
    ],
    tips: [
      'Format must match the text exactly',
      'Use DATE_FORMAT for the reverse operation'
    ],
    relatedFunctions: ['DATE_FORMAT', 'TO_DATE', 'DATE']
  },

  'DATE_SUBTRACT': {
    name: 'DATE_SUBTRACT',
    syntax: 'DATE_SUBTRACT(field, n, unit)',
    category: 'Date',
    description: 'Subtract time from date',
    explanation: 'The DATE_SUBTRACT function subtracts a specified amount of time from a date.',
    parameters: [
      { name: 'field', type: 'date', description: 'Starting date', required: true },
      { name: 'n', type: 'number', description: 'Amount to subtract', required: true },
      { name: 'unit', type: 'string', description: 'Time unit (years, months, weeks, days, hours, minutes, seconds)', required: true }
    ],
    examples: [
      { usage: 'DATE_SUBTRACT(@{dueDate}, 7, "days")', result: 'One week earlier', description: 'Reminder date' },
      { usage: 'DATE_SUBTRACT(TODAY(), 1, "years")', result: 'Last year', description: 'One year ago' }
    ],
    tips: [
      'Equivalent to DATE_ADD with negative number',
      'Handles month/year boundaries correctly'
    ],
    relatedFunctions: ['DATE_ADD', 'DATE_DIFF']
  },

  'HOUR': {
    name: 'HOUR',
    syntax: 'HOUR(field)',
    category: 'Date',
    description: 'Extract hour from datetime',
    explanation: 'The HOUR function extracts the hour component from a datetime value (0-23).',
    parameters: [
      { name: 'field', type: 'datetime', description: 'Datetime to extract hour from', required: true }
    ],
    examples: [
      { usage: 'HOUR(@{submittedAt})', result: '14', description: '2 PM = 14' },
      { usage: 'HOUR(NOW())', result: 'Current hour', description: 'Get current hour' }
    ],
    tips: [
      '24-hour format (0-23)',
      'Requires datetime field, not just date'
    ],
    relatedFunctions: ['MINUTE', 'SECOND', 'TIME']
  },

  'MINUTE': {
    name: 'MINUTE',
    syntax: 'MINUTE(field)',
    category: 'Date',
    description: 'Extract minute from datetime',
    explanation: 'The MINUTE function extracts the minute component from a datetime value (0-59).',
    parameters: [
      { name: 'field', type: 'datetime', description: 'Datetime to extract minute from', required: true }
    ],
    examples: [
      { usage: 'MINUTE(@{time})', result: '30', description: 'Get minutes' },
      { usage: 'MINUTE(NOW())', result: 'Current minute', description: 'Get current minute' }
    ],
    relatedFunctions: ['HOUR', 'SECOND', 'TIME']
  },

  'SECOND': {
    name: 'SECOND',
    syntax: 'SECOND(field)',
    category: 'Date',
    description: 'Extract second from datetime',
    explanation: 'The SECOND function extracts the second component from a datetime value (0-59).',
    parameters: [
      { name: 'field', type: 'datetime', description: 'Datetime to extract second from', required: true }
    ],
    examples: [
      { usage: 'SECOND(@{timestamp})', result: '45', description: 'Get seconds' },
      { usage: 'SECOND(NOW())', result: 'Current second', description: 'Get current second' }
    ],
    relatedFunctions: ['HOUR', 'MINUTE', 'TIME']
  },

  'WEEKDAY': {
    name: 'WEEKDAY',
    syntax: 'WEEKDAY(field)',
    category: 'Date',
    description: 'Get day of week (1-7)',
    explanation: 'The WEEKDAY function returns the day of the week as a number (1=Sunday through 7=Saturday, or 1=Monday through 7=Sunday depending on locale).',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to get weekday from', required: true }
    ],
    examples: [
      { usage: 'WEEKDAY(@{date})', result: '1-7', description: 'Get day of week' },
      { usage: 'IF(WEEKDAY(@{date}) == 1, "Monday", "Other")', result: 'Check if Monday', description: 'Weekday check' }
    ],
    tips: [
      'Day numbering may vary by locale',
      'Use IS_WEEKEND for weekend check'
    ],
    relatedFunctions: ['DAY', 'IS_WEEKEND', 'IS_WORKDAY']
  },

  'WEEK_OF_YEAR': {
    name: 'WEEK_OF_YEAR',
    syntax: 'WEEK_OF_YEAR(field)',
    category: 'Date',
    description: 'Get week number',
    explanation: 'The WEEK_OF_YEAR function returns the week number of the year (1-53) for a given date.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to get week number from', required: true }
    ],
    examples: [
      { usage: 'WEEK_OF_YEAR(@{date})', result: '1-53', description: 'Get week number' },
      { usage: 'WEEK_OF_YEAR(TODAY())', result: 'Current week', description: 'Get current week' }
    ],
    tips: [
      'Week 1 typically starts on first Monday of year',
      'Use for weekly reporting and scheduling'
    ],
    relatedFunctions: ['WEEKDAY', 'QUARTER', 'YEAR']
  },

  'QUARTER': {
    name: 'QUARTER',
    syntax: 'QUARTER(field)',
    category: 'Date',
    description: 'Get quarter (1-4)',
    explanation: 'The QUARTER function returns the quarter of the year (1-4) for a given date.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to get quarter from', required: true }
    ],
    examples: [
      { usage: 'QUARTER(@{date})', result: '1-4', description: 'Get quarter' },
      { usage: 'QUARTER(TODAY())', result: 'Current quarter', description: 'Get current quarter' }
    ],
    tips: [
      'Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec',
      'Useful for quarterly reporting'
    ],
    relatedFunctions: ['MONTH', 'YEAR', 'WEEK_OF_YEAR']
  },

  'START_OF_MONTH': {
    name: 'START_OF_MONTH',
    syntax: 'START_OF_MONTH(field)',
    category: 'Date',
    description: 'Get first day of month',
    explanation: 'The START_OF_MONTH function returns the first day of the month for a given date.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to get start of month from', required: true }
    ],
    examples: [
      { usage: 'START_OF_MONTH(@{date})', result: 'First of month', description: 'Get month start' },
      { usage: 'START_OF_MONTH(TODAY())', result: 'Start of current month', description: 'Current month start' }
    ],
    relatedFunctions: ['END_OF_MONTH', 'START_OF_YEAR', 'START_OF_WEEK']
  },

  'END_OF_MONTH': {
    name: 'END_OF_MONTH',
    syntax: 'END_OF_MONTH(field)',
    category: 'Date',
    description: 'Get last day of month',
    explanation: 'The END_OF_MONTH function returns the last day of the month for a given date.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to get end of month from', required: true }
    ],
    examples: [
      { usage: 'END_OF_MONTH(@{date})', result: 'Last of month', description: 'Get month end' },
      { usage: 'END_OF_MONTH(TODAY())', result: 'End of current month', description: 'Current month end' }
    ],
    tips: [
      'Handles varying month lengths (28-31 days)',
      'Handles leap year February correctly'
    ],
    relatedFunctions: ['START_OF_MONTH', 'END_OF_YEAR']
  },

  'START_OF_YEAR': {
    name: 'START_OF_YEAR',
    syntax: 'START_OF_YEAR(field)',
    category: 'Date',
    description: 'Get first day of year',
    explanation: 'The START_OF_YEAR function returns January 1st of the year for a given date.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to get start of year from', required: true }
    ],
    examples: [
      { usage: 'START_OF_YEAR(@{date})', result: 'Jan 1', description: 'Get year start' },
      { usage: 'START_OF_YEAR(TODAY())', result: 'Start of current year', description: 'Current year start' }
    ],
    relatedFunctions: ['END_OF_YEAR', 'START_OF_MONTH', 'YEAR']
  },

  'END_OF_YEAR': {
    name: 'END_OF_YEAR',
    syntax: 'END_OF_YEAR(field)',
    category: 'Date',
    description: 'Get last day of year',
    explanation: 'The END_OF_YEAR function returns December 31st of the year for a given date.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to get end of year from', required: true }
    ],
    examples: [
      { usage: 'END_OF_YEAR(@{date})', result: 'Dec 31', description: 'Get year end' },
      { usage: 'END_OF_YEAR(TODAY())', result: 'End of current year', description: 'Current year end' }
    ],
    relatedFunctions: ['START_OF_YEAR', 'END_OF_MONTH']
  },

  'START_OF_WEEK': {
    name: 'START_OF_WEEK',
    syntax: 'START_OF_WEEK(field)',
    category: 'Date',
    description: 'Get first day of week',
    explanation: 'The START_OF_WEEK function returns the first day (typically Monday or Sunday) of the week for a given date.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to get start of week from', required: true }
    ],
    examples: [
      { usage: 'START_OF_WEEK(@{date})', result: 'Week start date', description: 'Get week start' },
      { usage: 'START_OF_WEEK(TODAY())', result: 'Start of current week', description: 'Current week start' }
    ],
    tips: [
      'First day of week may vary by locale (Sunday or Monday)',
      'Useful for weekly reporting'
    ],
    relatedFunctions: ['START_OF_MONTH', 'WEEKDAY', 'WEEK_OF_YEAR']
  },

  'IS_WEEKEND': {
    name: 'IS_WEEKEND',
    syntax: 'IS_WEEKEND(field)',
    category: 'Date',
    description: 'Check if date is weekend',
    explanation: 'The IS_WEEKEND function returns true if the given date falls on Saturday or Sunday.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to check', required: true }
    ],
    examples: [
      { usage: 'IS_WEEKEND(@{date})', result: 'true/false', description: 'Check weekend' },
      { usage: 'ValidWhen(NOT(IS_WEEKEND(@{deliveryDate})), "Select a weekday")', result: 'Validate weekday', description: 'Require weekday' }
    ],
    relatedFunctions: ['IS_WORKDAY', 'WEEKDAY']
  },

  'IS_WORKDAY': {
    name: 'IS_WORKDAY',
    syntax: 'IS_WORKDAY(field)',
    category: 'Date',
    description: 'Check if date is workday',
    explanation: 'The IS_WORKDAY function returns true if the given date is a business day (Monday through Friday).',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to check', required: true }
    ],
    examples: [
      { usage: 'IS_WORKDAY(@{date})', result: 'true/false', description: 'Check workday' },
      { usage: 'VisibleWhen(IS_WORKDAY(@{meetingDate}))', result: 'Show for workdays', description: 'Workday visibility' }
    ],
    tips: [
      'Does not account for holidays',
      'Use with BUSINESS_DAYS for business calculations'
    ],
    relatedFunctions: ['IS_WEEKEND', 'BUSINESS_DAYS', 'ADD_BUSINESS_DAYS']
  },

  'IS_PAST': {
    name: 'IS_PAST',
    syntax: 'IS_PAST(field)',
    category: 'Date',
    description: 'Check if date is in past',
    explanation: 'The IS_PAST function returns true if the given date is before today.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to check', required: true }
    ],
    examples: [
      { usage: 'IS_PAST(@{deadline})', result: 'true/false', description: 'Check if deadline passed' },
      { usage: 'InvalidWhen(IS_PAST(@{startDate}), "Start date cannot be in the past")', result: 'Validate future', description: 'Prevent past dates' }
    ],
    relatedFunctions: ['IS_FUTURE', 'TODAY', 'DATE_DIFF']
  },

  'IS_FUTURE': {
    name: 'IS_FUTURE',
    syntax: 'IS_FUTURE(field)',
    category: 'Date',
    description: 'Check if date is in future',
    explanation: 'The IS_FUTURE function returns true if the given date is after today.',
    parameters: [
      { name: 'field', type: 'date', description: 'Date to check', required: true }
    ],
    examples: [
      { usage: 'IS_FUTURE(@{dueDate})', result: 'true/false', description: 'Check if due date is future' },
      { usage: 'ValidWhen(IS_FUTURE(@{expiryDate}), "Expiry date must be in future")', result: 'Validate future', description: 'Require future date' }
    ],
    relatedFunctions: ['IS_PAST', 'TODAY', 'DATE_DIFF']
  },

  'BUSINESS_DAYS': {
    name: 'BUSINESS_DAYS',
    syntax: 'BUSINESS_DAYS(startDate, endDate)',
    category: 'Date',
    description: 'Count business days between dates',
    explanation: 'The BUSINESS_DAYS function counts the number of business days (Monday-Friday) between two dates, excluding weekends.',
    parameters: [
      { name: 'startDate', type: 'date', description: 'Start date', required: true },
      { name: 'endDate', type: 'date', description: 'End date', required: true }
    ],
    examples: [
      { usage: 'BUSINESS_DAYS(@{startDate}, @{endDate})', result: 'Number of workdays', description: 'Count business days' },
      { usage: 'BUSINESS_DAYS(TODAY(), @{deadline})', result: 'Workdays until deadline', description: 'Days remaining' }
    ],
    tips: [
      'Excludes Saturday and Sunday',
      'Does not account for holidays'
    ],
    relatedFunctions: ['ADD_BUSINESS_DAYS', 'DATE_DIFF', 'IS_WORKDAY']
  },

  'ADD_BUSINESS_DAYS': {
    name: 'ADD_BUSINESS_DAYS',
    syntax: 'ADD_BUSINESS_DAYS(field, n)',
    category: 'Date',
    description: 'Add business days',
    explanation: 'The ADD_BUSINESS_DAYS function adds a specified number of business days (Monday-Friday) to a date, skipping weekends.',
    parameters: [
      { name: 'field', type: 'date', description: 'Starting date', required: true },
      { name: 'n', type: 'number', description: 'Number of business days to add', required: true }
    ],
    examples: [
      { usage: 'ADD_BUSINESS_DAYS(@{orderDate}, 5)', result: 'Delivery date', description: '5 business days later' },
      { usage: 'ADD_BUSINESS_DAYS(TODAY(), 10)', result: '10 workdays from now', description: 'Future business day' }
    ],
    tips: [
      'Skips Saturday and Sunday',
      'Does not account for holidays',
      'Use negative n to subtract business days'
    ],
    relatedFunctions: ['BUSINESS_DAYS', 'DATE_ADD', 'IS_WORKDAY']
  },

  // ==================== BOOLEAN FUNCTIONS ====================
  'IF': {
    name: 'IF',
    syntax: 'IF(condition, then, else)',
    category: 'Boolean',
    description: 'Conditional logic',
    explanation: 'The IF function returns one value if a condition is true and another value if it\'s false. This is the core conditional function for computed fields.',
    parameters: [
      { name: 'condition', type: 'boolean', description: 'Condition to evaluate', required: true },
      { name: 'then', type: 'any', description: 'Value if condition is true', required: true },
      { name: 'else', type: 'any', description: 'Value if condition is false', required: true }
    ],
    examples: [
      { usage: 'IF(@{amount} > 100, "High", "Low")', result: '"High" or "Low"', description: 'Text based on amount' },
      { usage: 'IF(@{isApproved}, @{price}, @{price} * 1.2)', result: 'Price with markup', description: 'Conditional calculation' },
      { usage: 'IF(IS_EMPTY(@{discount}), 0, @{discount})', result: 'Default to 0', description: 'Handle empty values' }
    ],
    tips: [
      'Can be nested for multiple conditions',
      'Use IFS for many conditions to avoid deep nesting'
    ],
    relatedFunctions: ['IFS', 'SWITCH', 'COALESCE']
  },

  'IFS': {
    name: 'IFS',
    syntax: 'IFS(cond1, val1, cond2, val2, ..., default)',
    category: 'Boolean',
    description: 'Multiple conditions',
    explanation: 'The IFS function evaluates multiple conditions in order and returns the value for the first true condition. Use "true" as the last condition for a default value.',
    parameters: [
      { name: 'conditions', type: 'pairs', description: 'Condition/value pairs, evaluated in order', required: true }
    ],
    examples: [
      { usage: 'IFS(@{score} >= 90, "A", @{score} >= 80, "B", @{score} >= 70, "C", true, "F")', result: 'Letter grade', description: 'Grade calculation' },
      { usage: 'IFS(@{status} == "URGENT", "red", @{status} == "HIGH", "orange", true, "green")', result: 'Status color', description: 'Color coding' }
    ],
    tips: [
      'Conditions are evaluated in order - first true wins',
      'Use "true" as last condition for default',
      'Cleaner than nested IF statements'
    ],
    relatedFunctions: ['IF', 'SWITCH']
  },

  'AND': {
    name: 'AND',
    syntax: 'AND(a, b, ...)',
    category: 'Boolean',
    description: 'All conditions must be true',
    explanation: 'The AND function returns true only if ALL conditions are true. If any condition is false, it returns false.',
    parameters: [
      { name: 'conditions', type: 'boolean[]', description: 'Conditions to check (all must be true)', required: true }
    ],
    examples: [
      { usage: 'AND(@{hasPermission}, @{isActive})', result: 'true/false', description: 'Check multiple flags' },
      { usage: 'AND(@{age} >= 18, @{hasLicense})', result: 'true/false', description: 'Multiple requirements' }
    ],
    tips: [
      'Short-circuits - stops at first false',
      'Use in VisibleWhen for multiple conditions'
    ],
    relatedFunctions: ['OR', 'NOT', 'XOR']
  },

  'OR': {
    name: 'OR',
    syntax: 'OR(a, b, ...)',
    category: 'Boolean',
    description: 'Any condition must be true',
    explanation: 'The OR function returns true if ANY condition is true. It only returns false if all conditions are false.',
    parameters: [
      { name: 'conditions', type: 'boolean[]', description: 'Conditions to check (any can be true)', required: true }
    ],
    examples: [
      { usage: 'OR(@{isAdmin}, @{isManager})', result: 'true/false', description: 'Check either role' },
      { usage: 'OR(@{type} == "A", @{type} == "B")', result: 'true/false', description: 'Multiple valid types' }
    ],
    tips: [
      'Short-circuits - stops at first true',
      'Consider IN() for checking multiple values'
    ],
    relatedFunctions: ['AND', 'NOT', 'IN']
  },

  'NOT': {
    name: 'NOT',
    syntax: 'NOT(condition)',
    category: 'Boolean',
    description: 'Reverse boolean value',
    explanation: 'The NOT function reverses a boolean value - true becomes false and false becomes true.',
    parameters: [
      { name: 'condition', type: 'boolean', description: 'Condition to negate', required: true }
    ],
    examples: [
      { usage: 'NOT(@{isDisabled})', result: 'true when not disabled', description: 'Negate flag' },
      { usage: 'NOT(IS_EMPTY(@{value}))', result: 'true when has value', description: 'Check has value' }
    ],
    tips: [
      'Equivalent to != true or == false',
      'Use IS_NOT_EMPTY instead of NOT(IS_EMPTY())'
    ],
    relatedFunctions: ['AND', 'OR', 'IS_NOT_EMPTY']
  },

  'IS_EMPTY': {
    name: 'IS_EMPTY',
    syntax: 'IS_EMPTY(field)',
    category: 'Boolean',
    description: 'Check if field is empty',
    explanation: 'The IS_EMPTY function checks if a field has no value. Returns true for null, undefined, empty string, or empty array.',
    parameters: [
      { name: 'field', type: 'any', description: 'Field to check', required: true }
    ],
    examples: [
      { usage: 'IS_EMPTY(@{notes})', result: 'true/false', description: 'Check if notes empty' },
      { usage: 'IF(IS_EMPTY(@{discount}), 0, @{discount})', result: 'Default to 0', description: 'Handle empty' }
    ],
    tips: [
      'Treats whitespace-only strings as not empty',
      'Use IS_BLANK for whitespace check'
    ],
    relatedFunctions: ['IS_NOT_EMPTY', 'IS_NULL', 'IS_BLANK', 'COALESCE']
  },

  'IS_NOT_EMPTY': {
    name: 'IS_NOT_EMPTY',
    syntax: 'IS_NOT_EMPTY(field)',
    category: 'Boolean',
    description: 'Check if field has value',
    explanation: 'The IS_NOT_EMPTY function checks if a field has a value. Returns true if the field is not null, undefined, empty string, or empty array.',
    parameters: [
      { name: 'field', type: 'any', description: 'Field to check', required: true }
    ],
    examples: [
      { usage: 'IS_NOT_EMPTY(@{email})', result: 'true/false', description: 'Check email provided' },
      { usage: 'VisibleWhen(IS_NOT_EMPTY(@{manager}))', result: 'Show when manager set', description: 'Conditional visibility' }
    ],
    relatedFunctions: ['IS_EMPTY', 'IS_NULL', 'COALESCE']
  },

  'BETWEEN': {
    name: 'BETWEEN',
    syntax: 'BETWEEN(field, min, max)',
    category: 'Boolean',
    description: 'Check if value is in range',
    explanation: 'The BETWEEN function checks if a value falls within a specified range (inclusive of both min and max).',
    parameters: [
      { name: 'field', type: 'number|date', description: 'Value to check', required: true },
      { name: 'min', type: 'number|date', description: 'Minimum value (inclusive)', required: true },
      { name: 'max', type: 'number|date', description: 'Maximum value (inclusive)', required: true }
    ],
    examples: [
      { usage: 'BETWEEN(@{age}, 18, 65)', result: 'true/false', description: 'Working age check' },
      { usage: 'BETWEEN(@{date}, @{startDate}, @{endDate})', result: 'true/false', description: 'Date in range' }
    ],
    tips: [
      'Inclusive - includes min and max values',
      'Works with numbers and dates'
    ],
    relatedFunctions: ['CLAMP', 'GREATER_THAN', 'LESS_THAN']
  },

  'IN': {
    name: 'IN',
    syntax: 'IN(field, list)',
    category: 'Boolean',
    description: 'Check if value is in list',
    explanation: 'The IN function checks if a value exists in a specified list of values.',
    parameters: [
      { name: 'field', type: 'any', description: 'Value to check', required: true },
      { name: 'list', type: 'array', description: 'List of valid values', required: true }
    ],
    examples: [
      { usage: 'IN(@{status}, ["DRAFT", "PENDING", "REVIEW"])', result: 'true/false', description: 'Check status' },
      { usage: 'IN(@{country}, ["US", "CA", "MX"])', result: 'true/false', description: 'North America check' }
    ],
    tips: [
      'Cleaner than multiple OR conditions',
      'Use NOT_IN for exclusion'
    ],
    relatedFunctions: ['NOT_IN', 'OR', 'CONTAINS']
  },

  'NOT_IN': {
    name: 'NOT_IN',
    syntax: 'NOT_IN(field, list)',
    category: 'Boolean',
    description: 'Check if value not in list',
    explanation: 'The NOT_IN function checks if a value does not exist in a specified list of values.',
    parameters: [
      { name: 'field', type: 'any', description: 'Value to check', required: true },
      { name: 'list', type: 'array', description: 'List of excluded values', required: true }
    ],
    examples: [
      { usage: 'NOT_IN(@{status}, ["CANCELLED", "REJECTED"])', result: 'true/false', description: 'Exclude statuses' },
      { usage: 'NOT_IN(@{role}, ["GUEST", "ANONYMOUS"])', result: 'true/false', description: 'Exclude roles' }
    ],
    tips: [
      'Equivalent to NOT(IN(...))',
      'Useful for exclusion lists'
    ],
    relatedFunctions: ['IN', 'AND', 'OR']
  },

  'XOR': {
    name: 'XOR',
    syntax: 'XOR(a, b)',
    category: 'Boolean',
    description: 'Exclusive OR',
    explanation: 'The XOR (exclusive OR) function returns true if exactly one of the conditions is true, but not both.',
    parameters: [
      { name: 'a', type: 'boolean', description: 'First condition', required: true },
      { name: 'b', type: 'boolean', description: 'Second condition', required: true }
    ],
    examples: [
      { usage: 'XOR(@{hasPhone}, @{hasEmail})', result: 'true/false', description: 'One but not both' },
      { usage: 'XOR(true, false)', result: 'true', description: 'Different values = true' },
      { usage: 'XOR(true, true)', result: 'false', description: 'Same values = false' }
    ],
    tips: [
      'Returns true when exactly one input is true',
      'Returns false when both are true or both are false'
    ],
    relatedFunctions: ['AND', 'OR', 'NOT']
  },

  'TRUE': {
    name: 'TRUE',
    syntax: 'TRUE()',
    category: 'Boolean',
    description: 'Returns true value',
    explanation: 'The TRUE function returns the boolean value true. Useful as a default or placeholder in conditional expressions.',
    parameters: [],
    examples: [
      { usage: 'TRUE()', result: 'true', description: 'Boolean true' },
      { usage: 'IFS(@{x} > 10, "High", TRUE(), "Normal")', result: 'Default case', description: 'Use as default in IFS' }
    ],
    relatedFunctions: ['FALSE', 'IF', 'IFS']
  },

  'FALSE': {
    name: 'FALSE',
    syntax: 'FALSE()',
    category: 'Boolean',
    description: 'Returns false value',
    explanation: 'The FALSE function returns the boolean value false. Useful as a default or placeholder in conditional expressions.',
    parameters: [],
    examples: [
      { usage: 'FALSE()', result: 'false', description: 'Boolean false' },
      { usage: 'DEFAULT(@{flag}, FALSE())', result: 'false', description: 'Default to false' }
    ],
    relatedFunctions: ['TRUE', 'IF', 'NOT']
  },

  'IS_NULL': {
    name: 'IS_NULL',
    syntax: 'IS_NULL(field)',
    category: 'Boolean',
    description: 'Check if field is null',
    explanation: 'The IS_NULL function checks if a field is specifically null (not just empty). More strict than IS_EMPTY.',
    parameters: [
      { name: 'field', type: 'any', description: 'Field to check', required: true }
    ],
    examples: [
      { usage: 'IS_NULL(@{manager})', result: 'true/false', description: 'Check if manager not set' },
      { usage: 'IF(IS_NULL(@{ref}), "N/A", @{ref})', result: 'Handle null', description: 'Null handling' }
    ],
    tips: [
      'More strict than IS_EMPTY',
      'Empty string is not null'
    ],
    relatedFunctions: ['IS_EMPTY', 'IS_BLANK', 'COALESCE']
  },

  'IS_BLANK': {
    name: 'IS_BLANK',
    syntax: 'IS_BLANK(field)',
    category: 'Boolean',
    description: 'Check if empty or whitespace',
    explanation: 'The IS_BLANK function checks if a field is empty, null, or contains only whitespace characters.',
    parameters: [
      { name: 'field', type: 'any', description: 'Field to check', required: true }
    ],
    examples: [
      { usage: 'IS_BLANK(@{notes})', result: 'true/false', description: 'Check if notes blank' },
      { usage: 'IS_BLANK("   ")', result: 'true', description: 'Whitespace is blank' }
    ],
    tips: [
      'More comprehensive than IS_EMPTY',
      'Treats whitespace-only strings as blank'
    ],
    relatedFunctions: ['IS_EMPTY', 'IS_NULL', 'TRIM']
  },

  'EQUALS': {
    name: 'EQUALS',
    syntax: 'EQUALS(a, b)',
    category: 'Boolean',
    description: 'Check if values are equal',
    explanation: 'The EQUALS function compares two values for equality.',
    parameters: [
      { name: 'a', type: 'any', description: 'First value', required: true },
      { name: 'b', type: 'any', description: 'Second value', required: true }
    ],
    examples: [
      { usage: 'EQUALS(@{status}, "APPROVED")', result: 'true/false', description: 'Check status' },
      { usage: 'EQUALS(@{field1}, @{field2})', result: 'true/false', description: 'Compare fields' }
    ],
    tips: [
      'Same as using == operator',
      'Type-sensitive comparison'
    ],
    relatedFunctions: ['NOT_EQUALS', 'IN']
  },

  'NOT_EQUALS': {
    name: 'NOT_EQUALS',
    syntax: 'NOT_EQUALS(a, b)',
    category: 'Boolean',
    description: 'Check if values differ',
    explanation: 'The NOT_EQUALS function checks if two values are not equal.',
    parameters: [
      { name: 'a', type: 'any', description: 'First value', required: true },
      { name: 'b', type: 'any', description: 'Second value', required: true }
    ],
    examples: [
      { usage: 'NOT_EQUALS(@{status}, "DRAFT")', result: 'true/false', description: 'Not draft status' },
      { usage: 'NOT_EQUALS(@{newValue}, @{oldValue})', result: 'true/false', description: 'Check for changes' }
    ],
    relatedFunctions: ['EQUALS', 'NOT', 'NOT_IN']
  },

  'GREATER_THAN': {
    name: 'GREATER_THAN',
    syntax: 'GREATER_THAN(a, b)',
    category: 'Boolean',
    description: 'Check if a > b',
    explanation: 'The GREATER_THAN function checks if the first value is greater than the second.',
    parameters: [
      { name: 'a', type: 'number|date', description: 'First value', required: true },
      { name: 'b', type: 'number|date', description: 'Second value', required: true }
    ],
    examples: [
      { usage: 'GREATER_THAN(@{amount}, 1000)', result: 'true/false', description: 'Amount over 1000' },
      { usage: 'GREATER_THAN(@{endDate}, @{startDate})', result: 'true/false', description: 'End after start' }
    ],
    relatedFunctions: ['LESS_THAN', 'GREATER_OR_EQUAL', 'BETWEEN']
  },

  'GREATER_OR_EQUAL': {
    name: 'GREATER_OR_EQUAL',
    syntax: 'GREATER_OR_EQUAL(a, b)',
    category: 'Boolean',
    description: 'Check if a >= b',
    explanation: 'The GREATER_OR_EQUAL function checks if the first value is greater than or equal to the second.',
    parameters: [
      { name: 'a', type: 'number|date', description: 'First value', required: true },
      { name: 'b', type: 'number|date', description: 'Second value', required: true }
    ],
    examples: [
      { usage: 'GREATER_OR_EQUAL(@{age}, 18)', result: 'true/false', description: '18 or older' },
      { usage: 'GREATER_OR_EQUAL(@{score}, @{passingScore})', result: 'true/false', description: 'Passed' }
    ],
    relatedFunctions: ['LESS_OR_EQUAL', 'GREATER_THAN', 'BETWEEN']
  },

  'LESS_THAN': {
    name: 'LESS_THAN',
    syntax: 'LESS_THAN(a, b)',
    category: 'Boolean',
    description: 'Check if a < b',
    explanation: 'The LESS_THAN function checks if the first value is less than the second.',
    parameters: [
      { name: 'a', type: 'number|date', description: 'First value', required: true },
      { name: 'b', type: 'number|date', description: 'Second value', required: true }
    ],
    examples: [
      { usage: 'LESS_THAN(@{quantity}, @{minStock})', result: 'true/false', description: 'Low stock' },
      { usage: 'LESS_THAN(@{deadline}, TODAY())', result: 'true/false', description: 'Overdue' }
    ],
    relatedFunctions: ['GREATER_THAN', 'LESS_OR_EQUAL', 'BETWEEN']
  },

  'LESS_OR_EQUAL': {
    name: 'LESS_OR_EQUAL',
    syntax: 'LESS_OR_EQUAL(a, b)',
    category: 'Boolean',
    description: 'Check if a <= b',
    explanation: 'The LESS_OR_EQUAL function checks if the first value is less than or equal to the second.',
    parameters: [
      { name: 'a', type: 'number|date', description: 'First value', required: true },
      { name: 'b', type: 'number|date', description: 'Second value', required: true }
    ],
    examples: [
      { usage: 'LESS_OR_EQUAL(@{budget}, @{limit})', result: 'true/false', description: 'Within budget' },
      { usage: 'LESS_OR_EQUAL(@{date}, TODAY())', result: 'true/false', description: 'Today or earlier' }
    ],
    relatedFunctions: ['GREATER_OR_EQUAL', 'LESS_THAN', 'BETWEEN']
  },

  'IS_VALID_EMAIL': {
    name: 'IS_VALID_EMAIL',
    syntax: 'IS_VALID_EMAIL(field)',
    category: 'Boolean',
    description: 'Validate email format',
    explanation: 'The IS_VALID_EMAIL function checks if a value is a properly formatted email address.',
    parameters: [
      { name: 'field', type: 'string', description: 'Value to validate', required: true }
    ],
    examples: [
      { usage: 'IS_VALID_EMAIL(@{email})', result: 'true/false', description: 'Check email format' },
      { usage: 'ValidWhen(IS_VALID_EMAIL(@{contactEmail}), "Invalid email")', result: 'Validation', description: 'Email validation' }
    ],
    tips: [
      'Checks format only, not if email exists',
      'Validates pattern like name@domain.tld'
    ],
    relatedFunctions: ['IS_VALID_PHONE', 'IS_VALID_URL', 'REGEX_MATCH']
  },

  'IS_VALID_PHONE': {
    name: 'IS_VALID_PHONE',
    syntax: 'IS_VALID_PHONE(field)',
    category: 'Boolean',
    description: 'Validate phone format',
    explanation: 'The IS_VALID_PHONE function checks if a value is a properly formatted phone number.',
    parameters: [
      { name: 'field', type: 'string', description: 'Value to validate', required: true }
    ],
    examples: [
      { usage: 'IS_VALID_PHONE(@{phone})', result: 'true/false', description: 'Check phone format' },
      { usage: 'ValidWhen(IS_VALID_PHONE(@{mobile}), "Invalid phone")', result: 'Validation', description: 'Phone validation' }
    ],
    tips: [
      'Format requirements may vary by locale',
      'May accept various formats with/without country code'
    ],
    relatedFunctions: ['IS_VALID_EMAIL', 'IS_VALID_URL', 'REGEX_MATCH']
  },

  'IS_VALID_URL': {
    name: 'IS_VALID_URL',
    syntax: 'IS_VALID_URL(field)',
    category: 'Boolean',
    description: 'Validate URL format',
    explanation: 'The IS_VALID_URL function checks if a value is a properly formatted URL.',
    parameters: [
      { name: 'field', type: 'string', description: 'Value to validate', required: true }
    ],
    examples: [
      { usage: 'IS_VALID_URL(@{website})', result: 'true/false', description: 'Check URL format' },
      { usage: 'ValidWhen(IS_VALID_URL(@{link}), "Invalid URL")', result: 'Validation', description: 'URL validation' }
    ],
    tips: [
      'Checks for valid URL structure',
      'Typically requires http:// or https:// prefix'
    ],
    relatedFunctions: ['IS_VALID_EMAIL', 'IS_VALID_PHONE', 'REGEX_MATCH']
  },

  // ==================== VALIDATION FUNCTIONS ====================
  'ValidWhen': {
    name: 'ValidWhen',
    syntax: 'ValidWhen(condition, errorMessage)',
    category: 'Validation',
    description: 'Field is valid only when condition is true',
    explanation: 'The ValidWhen function validates a field based on a condition. If the condition evaluates to false, the field is considered invalid and the specified error message is displayed. This is essential for form validation and ensuring data quality.',
    parameters: [
      { name: 'condition', type: 'boolean', description: 'Expression that must be true for valid input', required: true },
      { name: 'errorMessage', type: 'string', description: 'Message shown when validation fails', required: true }
    ],
    examples: [
      { usage: 'ValidWhen(@{age} >= 18, "Must be 18 or older")', result: 'Validates age', description: 'Age validation' },
      { usage: 'ValidWhen(LEN(@{phone}) == 10, "Phone must be 10 digits")', result: 'Validates length', description: 'Length check' },
      { usage: 'ValidWhen(@{endDate} > @{startDate}, "End must be after start")', result: 'Date comparison', description: 'Date validation' }
    ],
    tips: [
      'Use for business rule validations',
      'Error message should be user-friendly and actionable',
      'Combine with other functions for complex validations',
      'Validation runs when the field value changes'
    ],
    troubleshooting: [
      'If validation not triggering, check field reference syntax',
      'Ensure comparison types match (string vs number)',
      'Use IS_EMPTY() to handle blank values gracefully'
    ],
    relatedFunctions: ['InvalidWhen', 'CheckValid', 'MandatoryWhen']
  },
  'InvalidWhen': {
    name: 'InvalidWhen',
    syntax: 'InvalidWhen(condition, errorMessage)',
    category: 'Validation',
    description: 'Field is invalid when condition is true',
    explanation: 'The InvalidWhen function is the opposite of ValidWhen. It marks a field as invalid when the specified condition evaluates to true. Use this when it\'s more natural to express what makes a value invalid rather than valid.',
    parameters: [
      { name: 'condition', type: 'boolean', description: 'Expression that when true makes field invalid', required: true },
      { name: 'errorMessage', type: 'string', description: 'Message shown when validation fails', required: true }
    ],
    examples: [
      { usage: 'InvalidWhen(@{quantity} < 0, "Quantity cannot be negative")', result: 'Validates positive', description: 'Negative check' },
      { usage: 'InvalidWhen(CONTAINS(@{email}, " "), "Email cannot contain spaces")', result: 'No spaces allowed', description: 'Character check' },
      { usage: 'InvalidWhen(@{password} == @{username}, "Password cannot match username")', result: 'Different values', description: 'Equality check' }
    ],
    tips: [
      'Use when the invalid condition is simpler to express',
      'Good for blacklist-style validations',
      'Can be combined with ValidWhen on the same field'
    ],
    relatedFunctions: ['ValidWhen', 'CheckValid', 'REGEX_MATCH']
  },
  'CheckValid': {
    name: 'CheckValid',
    syntax: 'CheckValid(fieldRef)',
    category: 'Validation',
    description: 'Check if a field passes its validation rules',
    explanation: 'The CheckValid function returns true if the referenced field passes all its validation rules, and false otherwise. Use this to create conditional logic based on field validity or to check validation status before submission.',
    parameters: [
      { name: 'fieldRef', type: 'reference', description: 'Reference to the field to check', required: true }
    ],
    examples: [
      { usage: 'CheckValid(@{email})', result: 'true/false', description: 'Check email validity' },
      { usage: 'VisibleWhen(CheckValid(@{step1Field}), @{step2Section})', result: 'Conditional display', description: 'Show next step if valid' },
      { usage: 'AND(CheckValid(@{field1}), CheckValid(@{field2}))', result: 'true/false', description: 'Multiple field check' }
    ],
    tips: [
      'Useful for multi-step form validation',
      'Can control visibility of dependent sections',
      'Returns false for empty required fields'
    ],
    relatedFunctions: ['ValidWhen', 'InvalidWhen', 'IS_EMPTY']
  },
  'VisibleWhen': {
    name: 'VisibleWhen',
    syntax: 'VisibleWhen(condition)',
    category: 'Validation',
    description: 'Show field only when condition is true',
    explanation: 'The VisibleWhen function controls field visibility based on a condition. When the condition is true, the field is visible; when false, the field is hidden. This is essential for creating dynamic forms that adapt based on user input.',
    parameters: [
      { name: 'condition', type: 'boolean', description: 'Expression that determines visibility', required: true }
    ],
    examples: [
      { usage: 'VisibleWhen(@{hasSpouse} == true)', result: 'Shows when checked', description: 'Checkbox dependent' },
      { usage: 'VisibleWhen(@{country} == "USA")', result: 'Shows for USA only', description: 'Value dependent' },
      { usage: 'VisibleWhen(@{total} > 1000)', result: 'Shows for large orders', description: 'Threshold based' },
      { usage: 'VisibleWhen(OR(@{role} == "Manager", @{role} == "Admin"))', result: 'Multiple conditions', description: 'Role based' }
    ],
    tips: [
      'Hidden fields are not submitted with the form',
      'Use for progressive disclosure of complex forms',
      'Consider MandatoryWhen for conditionally required fields',
      'Combine with AND/OR for complex conditions'
    ],
    troubleshooting: [
      'If field not appearing, check the condition syntax',
      'Verify the referenced field has the expected value',
      'Use browser dev tools to debug condition evaluation'
    ],
    relatedFunctions: ['HiddenWhen', 'MandatoryWhen', 'ReadOnlyWhen']
  },
  'MandatoryWhen': {
    name: 'MandatoryWhen',
    syntax: 'MandatoryWhen(condition)',
    category: 'Validation',
    description: 'Field is required when condition is true',
    explanation: 'The MandatoryWhen function makes a field conditionally required. When the condition evaluates to true, the field must have a value for the form to be valid. This is useful for fields that are only required in certain scenarios.',
    parameters: [
      { name: 'condition', type: 'boolean', description: 'Expression that determines if field is required', required: true }
    ],
    examples: [
      { usage: 'MandatoryWhen(@{paymentMethod} == "Credit Card")', result: 'Required for cards', description: 'Payment dependent' },
      { usage: 'MandatoryWhen(@{isEmployee} == true)', result: 'Required for employees', description: 'Status dependent' },
      { usage: 'MandatoryWhen(NOT(IS_EMPTY(@{otherField})))', result: 'Required if other filled', description: 'Cross-field dependency' }
    ],
    tips: [
      'Combine with VisibleWhen for fields that should only appear when required',
      'Shows a required indicator (*) when condition is true',
      'Empty values will trigger validation error when mandatory'
    ],
    relatedFunctions: ['VisibleWhen', 'ValidWhen', 'IS_EMPTY']
  },
  'ReadOnlyWhen': {
    name: 'ReadOnlyWhen',
    syntax: 'ReadOnlyWhen(condition)',
    category: 'Validation',
    description: 'Field is read-only when condition is true',
    explanation: 'The ReadOnlyWhen function makes a field non-editable based on a condition. When the condition is true, the field displays its value but cannot be modified. Use this for calculated fields or fields that should be locked under certain conditions.',
    parameters: [
      { name: 'condition', type: 'boolean', description: 'Expression that determines if field is read-only', required: true }
    ],
    examples: [
      { usage: 'ReadOnlyWhen(@{status} == "Approved")', result: 'Locked when approved', description: 'Status based lock' },
      { usage: 'ReadOnlyWhen(true)', result: 'Always read-only', description: 'Calculated fields' },
      { usage: 'ReadOnlyWhen(@{role} != "Admin")', result: 'Editable for admins only', description: 'Role based editing' }
    ],
    tips: [
      'Read-only fields still submit their values',
      'Use for calculated or auto-populated fields',
      'Consider visual styling to indicate read-only state'
    ],
    relatedFunctions: ['VisibleWhen', 'HiddenWhen', 'MandatoryWhen']
  },
  'HiddenWhen': {
    name: 'HiddenWhen',
    syntax: 'HiddenWhen(condition)',
    category: 'Validation',
    description: 'Hide field when condition is true',
    explanation: 'The HiddenWhen function is the inverse of VisibleWhen. It hides a field when the condition is true. Use this when it\'s more natural to express when a field should be hidden rather than when it should be visible.',
    parameters: [
      { name: 'condition', type: 'boolean', description: 'Expression that when true hides the field', required: true }
    ],
    examples: [
      { usage: 'HiddenWhen(@{userType} == "Guest")', result: 'Hidden for guests', description: 'User type based' },
      { usage: 'HiddenWhen(IS_EMPTY(@{prerequisite}))', result: 'Hidden until filled', description: 'Dependency based' },
      { usage: 'HiddenWhen(@{step} < 3)', result: 'Hidden in early steps', description: 'Step based' }
    ],
    tips: [
      'Equivalent to VisibleWhen(NOT(condition))',
      'Use whichever makes your logic clearer',
      'Hidden fields are excluded from form submission'
    ],
    relatedFunctions: ['VisibleWhen', 'MandatoryWhen', 'ReadOnlyWhen']
  },
  'RegexWhen': {
    name: 'RegexWhen',
    syntax: 'RegexWhen(pattern, errorMessage)',
    category: 'Validation',
    description: 'Validate field against a regex pattern',
    explanation: 'The RegexWhen function validates a field\'s value against a regular expression pattern. If the value does not match the pattern, the field is considered invalid and the error message is displayed. This is powerful for format validation.',
    parameters: [
      { name: 'pattern', type: 'string', description: 'Regular expression pattern to match', required: true },
      { name: 'errorMessage', type: 'string', description: 'Message shown when pattern does not match', required: true }
    ],
    examples: [
      { usage: 'RegexWhen("^[A-Z]{2}\\d{6}$", "Invalid ID format")', result: 'Format validation', description: 'ID pattern check' },
      { usage: 'RegexWhen("^\\d{3}-\\d{2}-\\d{4}$", "Invalid SSN format")', result: 'SSN format', description: 'SSN validation' },
      { usage: 'RegexWhen("^[a-zA-Z]+$", "Letters only")', result: 'Letters only', description: 'Character restriction' }
    ],
    tips: [
      'Escape backslashes in patterns (use \\\\ for \\)',
      'Test patterns separately before using',
      'Common patterns: email, phone, postal code',
      'Use ^ and $ for full string matching'
    ],
    troubleshooting: [
      'Pattern not matching? Check escape sequences',
      'Remember regex is case-sensitive by default',
      'Use online regex testers to verify patterns'
    ],
    relatedFunctions: ['ValidWhen', 'REGEX_MATCH', 'REGEX_REPLACE']
  },

  // ==================== UTILITY FUNCTIONS ====================
  'COALESCE': {
    name: 'COALESCE',
    syntax: 'COALESCE(a, b, ...)',
    category: 'Utility',
    description: 'Return first non-empty value',
    explanation: 'The COALESCE function returns the first value that is not null or empty. Useful for providing fallback values.',
    parameters: [
      { name: 'values', type: 'any[]', description: 'Values to check in order', required: true }
    ],
    examples: [
      { usage: 'COALESCE(@{nickname}, @{firstName}, "Guest")', result: 'First non-empty', description: 'Display name fallback' },
      { usage: 'COALESCE(@{discount}, 0)', result: 'Value or 0', description: 'Default to 0' }
    ],
    tips: [
      'Evaluates values in order, returns first non-empty',
      'Last argument is typically the default'
    ],
    relatedFunctions: ['DEFAULT', 'IS_EMPTY', 'IF']
  },

  'DEFAULT': {
    name: 'DEFAULT',
    syntax: 'DEFAULT(field, value)',
    category: 'Utility',
    description: 'Set default if empty',
    explanation: 'The DEFAULT function returns the field value if it has a value, otherwise returns the specified default value.',
    parameters: [
      { name: 'field', type: 'any', description: 'Field to check', required: true },
      { name: 'value', type: 'any', description: 'Default value if field is empty', required: true }
    ],
    examples: [
      { usage: 'DEFAULT(@{quantity}, 1)', result: 'Quantity or 1', description: 'Default quantity' },
      { usage: 'DEFAULT(@{notes}, "No notes")', result: 'Notes or placeholder', description: 'Default text' }
    ],
    tips: [
      'Simpler than COALESCE for two values',
      'Use for form field defaults'
    ],
    relatedFunctions: ['COALESCE', 'IS_EMPTY']
  },

  'FORMAT_CURRENCY': {
    name: 'FORMAT_CURRENCY',
    syntax: 'FORMAT_CURRENCY(field, currency)',
    category: 'Utility',
    description: 'Format as currency',
    explanation: 'The FORMAT_CURRENCY function formats a number as currency with the appropriate symbol and decimal places.',
    parameters: [
      { name: 'field', type: 'number', description: 'Amount to format', required: true },
      { name: 'currency', type: 'string', description: 'Currency code (USD, EUR, GBP, etc.)', required: true }
    ],
    examples: [
      { usage: 'FORMAT_CURRENCY(@{amount}, "USD")', result: '"$1,234.56"', description: 'US Dollar format' },
      { usage: 'FORMAT_CURRENCY(@{price}, "EUR")', result: '"\u20AC1.234,56"', description: 'Euro format' }
    ],
    tips: [
      'Automatically adds currency symbol',
      'Formats thousands separators'
    ],
    relatedFunctions: ['FORMAT_NUMBER', 'FORMAT_PERCENT', 'ROUND']
  },

  'FORMAT_NUMBER': {
    name: 'FORMAT_NUMBER',
    syntax: 'FORMAT_NUMBER(field, decimals)',
    category: 'Utility',
    description: 'Format number with decimals',
    explanation: 'The FORMAT_NUMBER function formats a number with the specified decimal places and thousands separators.',
    parameters: [
      { name: 'field', type: 'number', description: 'Number to format', required: true },
      { name: 'decimals', type: 'number', description: 'Decimal places', required: true }
    ],
    examples: [
      { usage: 'FORMAT_NUMBER(@{value}, 2)', result: '"1,234.56"', description: 'Two decimals' },
      { usage: 'FORMAT_NUMBER(@{percentage}, 1)', result: '"75.5"', description: 'One decimal' }
    ],
    relatedFunctions: ['FORMAT_CURRENCY', 'FORMAT_PERCENT', 'ROUND']
  },

  'CURRENT_USER': {
    name: 'CURRENT_USER',
    syntax: 'CURRENT_USER()',
    category: 'Utility',
    description: 'Get current user name',
    explanation: 'The CURRENT_USER function returns the full name of the currently logged-in user.',
    parameters: [],
    examples: [
      { usage: 'CURRENT_USER()', result: '"John Doe"', description: 'Current user\'s name' },
      { usage: 'DEFAULT(@{requestedBy}, CURRENT_USER())', result: 'Auto-fill requester', description: 'Default to current user' }
    ],
    tips: [
      'Use for audit fields',
      'Use CURRENT_USER_ID() for system references'
    ],
    relatedFunctions: ['CURRENT_USER_EMAIL', 'CURRENT_USER_ID', 'CURRENT_USER_DEPT']
  },

  'CURRENT_USER_EMAIL': {
    name: 'CURRENT_USER_EMAIL',
    syntax: 'CURRENT_USER_EMAIL()',
    category: 'Utility',
    description: 'Get current user email',
    explanation: 'The CURRENT_USER_EMAIL function returns the email address of the currently logged-in user.',
    parameters: [],
    examples: [
      { usage: 'CURRENT_USER_EMAIL()', result: '"john.doe@company.com"', description: 'Current user\'s email' }
    ],
    relatedFunctions: ['CURRENT_USER', 'CURRENT_USER_ID']
  },

  'UUID': {
    name: 'UUID',
    syntax: 'UUID()',
    category: 'Utility',
    description: 'Generate unique identifier',
    explanation: 'The UUID function generates a universally unique identifier (UUID v4) string.',
    parameters: [],
    examples: [
      { usage: 'UUID()', result: '"550e8400-e29b-41d4-a716-446655440000"', description: 'Generate UUID' }
    ],
    tips: [
      'Generates new UUID each time evaluated',
      'Use for unique reference numbers'
    ],
    relatedFunctions: ['SEQUENCE']
  },

  'SEQUENCE': {
    name: 'SEQUENCE',
    syntax: 'SEQUENCE(prefix)',
    category: 'Utility',
    description: 'Generate sequential number',
    explanation: 'The SEQUENCE function generates a sequential number with an optional prefix. Numbers are unique across the workflow.',
    parameters: [
      { name: 'prefix', type: 'string', description: 'Prefix for the sequence number', required: false }
    ],
    examples: [
      { usage: 'SEQUENCE("INV-")', result: '"INV-00001"', description: 'Invoice number' },
      { usage: 'SEQUENCE("REQ-")', result: '"REQ-00001"', description: 'Request number' }
    ],
    tips: [
      'Numbers are sequential per workflow',
      'Use for document numbers'
    ],
    relatedFunctions: ['UUID']
  },

  'TO_NUMBER': {
    name: 'TO_NUMBER',
    syntax: 'TO_NUMBER(field)',
    category: 'Utility',
    description: 'Convert text to number',
    explanation: 'The TO_NUMBER function converts a text value to a number. Non-numeric text returns null/NaN.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text value to convert', required: true }
    ],
    examples: [
      { usage: 'TO_NUMBER("123")', result: '123', description: 'String to number' },
      { usage: 'TO_NUMBER(@{textAmount})', result: 'Numeric value', description: 'Convert text field' }
    ],
    tips: [
      'Returns NaN for non-numeric strings',
      'Use IS_NUMBER to validate first'
    ],
    relatedFunctions: ['TO_TEXT', 'IS_NUMBER', 'FORMAT_NUMBER']
  },

  'TO_TEXT': {
    name: 'TO_TEXT',
    syntax: 'TO_TEXT(field)',
    category: 'Utility',
    description: 'Convert value to text',
    explanation: 'The TO_TEXT function converts any value to its text representation.',
    parameters: [
      { name: 'field', type: 'any', description: 'Value to convert', required: true }
    ],
    examples: [
      { usage: 'TO_TEXT(123)', result: '"123"', description: 'Number to string' },
      { usage: 'TO_TEXT(@{numericCode})', result: 'String value', description: 'Convert for display' }
    ],
    relatedFunctions: ['TO_NUMBER', 'FORMAT_NUMBER', 'CONCAT']
  },

  'FORMAT_PERCENT': {
    name: 'FORMAT_PERCENT',
    syntax: 'FORMAT_PERCENT(field)',
    category: 'Utility',
    description: 'Format as percentage',
    explanation: 'The FORMAT_PERCENT function formats a decimal number as a percentage string.',
    parameters: [
      { name: 'field', type: 'number', description: 'Decimal value to format', required: true }
    ],
    examples: [
      { usage: 'FORMAT_PERCENT(@{rate})', result: '"75%"', description: 'Format 0.75 as 75%' },
      { usage: 'FORMAT_PERCENT(0.125)', result: '"12.5%"', description: 'Format decimal' }
    ],
    tips: [
      'Multiplies by 100 and adds % sign',
      'Use PERCENTAGE to calculate percentage first'
    ],
    relatedFunctions: ['PERCENTAGE', 'FORMAT_NUMBER', 'FORMAT_CURRENCY']
  },

  'TO_BOOLEAN': {
    name: 'TO_BOOLEAN',
    syntax: 'TO_BOOLEAN(field)',
    category: 'Utility',
    description: 'Convert value to boolean',
    explanation: 'The TO_BOOLEAN function converts a value to boolean. Truthy values become true, falsy values become false.',
    parameters: [
      { name: 'field', type: 'any', description: 'Value to convert', required: true }
    ],
    examples: [
      { usage: 'TO_BOOLEAN(@{flag})', result: 'true/false', description: 'Convert to boolean' },
      { usage: 'TO_BOOLEAN("true")', result: 'true', description: 'String "true" to boolean' },
      { usage: 'TO_BOOLEAN(0)', result: 'false', description: 'Zero is false' }
    ],
    tips: [
      '"true", "yes", "1", non-zero numbers → true',
      '"false", "no", "0", 0, null, empty → false'
    ],
    relatedFunctions: ['TO_NUMBER', 'TO_TEXT', 'IS_EMPTY']
  },

  'TO_DATE': {
    name: 'TO_DATE',
    syntax: 'TO_DATE(field)',
    category: 'Utility',
    description: 'Convert text to date',
    explanation: 'The TO_DATE function converts a text string to a date value using automatic format detection.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text value to convert', required: true }
    ],
    examples: [
      { usage: 'TO_DATE(@{dateString})', result: 'Date object', description: 'Convert text to date' },
      { usage: 'TO_DATE("2024-12-25")', result: '2024-12-25', description: 'ISO format' }
    ],
    tips: [
      'Attempts to parse common date formats',
      'Use DATE_PARSE for specific formats'
    ],
    relatedFunctions: ['DATE_PARSE', 'DATE', 'DATE_FORMAT']
  },

  'CURRENT_USER_ID': {
    name: 'CURRENT_USER_ID',
    syntax: 'CURRENT_USER_ID()',
    category: 'Utility',
    description: 'Get current user ID',
    explanation: 'The CURRENT_USER_ID function returns the unique identifier of the currently logged-in user.',
    parameters: [],
    examples: [
      { usage: 'CURRENT_USER_ID()', result: '12345', description: 'User ID number' },
      { usage: 'DEFAULT(@{assignedTo}, CURRENT_USER_ID())', result: 'Auto-assign', description: 'Default to current user' }
    ],
    tips: [
      'Use for system references and lookups',
      'Use CURRENT_USER() for display name'
    ],
    relatedFunctions: ['CURRENT_USER', 'CURRENT_USER_EMAIL', 'CURRENT_USER_DEPT']
  },

  'CURRENT_USER_DEPT': {
    name: 'CURRENT_USER_DEPT',
    syntax: 'CURRENT_USER_DEPT()',
    category: 'Utility',
    description: 'Get current user department',
    explanation: 'The CURRENT_USER_DEPT function returns the department of the currently logged-in user.',
    parameters: [],
    examples: [
      { usage: 'CURRENT_USER_DEPT()', result: '"Finance"', description: 'User department name' },
      { usage: 'DEFAULT(@{department}, CURRENT_USER_DEPT())', result: 'Auto-fill dept', description: 'Default to user dept' }
    ],
    relatedFunctions: ['CURRENT_USER', 'CURRENT_USER_SBU', 'CURRENT_USER_ID']
  },

  'CURRENT_USER_SBU': {
    name: 'CURRENT_USER_SBU',
    syntax: 'CURRENT_USER_SBU()',
    category: 'Utility',
    description: 'Get current user SBU',
    explanation: 'The CURRENT_USER_SBU function returns the SBU (Strategic Business Unit) of the currently logged-in user.',
    parameters: [],
    examples: [
      { usage: 'CURRENT_USER_SBU()', result: '"Corporate"', description: 'User SBU name' },
      { usage: 'DEFAULT(@{sbu}, CURRENT_USER_SBU())', result: 'Auto-fill SBU', description: 'Default to user SBU' }
    ],
    relatedFunctions: ['CURRENT_USER', 'CURRENT_USER_DEPT', 'CURRENT_USER_ID']
  },

  'FIELD_VALUE': {
    name: 'FIELD_VALUE',
    syntax: 'FIELD_VALUE(fieldName)',
    category: 'Utility',
    description: 'Get value of another field',
    explanation: 'The FIELD_VALUE function retrieves the value of another field by name. Useful when the field name is dynamic.',
    parameters: [
      { name: 'fieldName', type: 'string', description: 'Name of field to get value from', required: true }
    ],
    examples: [
      { usage: 'FIELD_VALUE("totalAmount")', result: 'Field value', description: 'Get field by name' },
      { usage: 'FIELD_VALUE(@{selectedField})', result: 'Dynamic field access', description: 'Dynamic field' }
    ],
    tips: [
      'Alternative to @{fieldName} syntax',
      'Useful for dynamic field references'
    ],
    relatedFunctions: ['LOOKUP', 'COALESCE']
  },

  'LOOKUP': {
    name: 'LOOKUP',
    syntax: 'LOOKUP(field, source)',
    category: 'Utility',
    description: 'Lookup value from data source',
    explanation: 'The LOOKUP function retrieves a value from a configured data source based on a key field.',
    parameters: [
      { name: 'field', type: 'any', description: 'Key value to look up', required: true },
      { name: 'source', type: 'string', description: 'Name of data source', required: true }
    ],
    examples: [
      { usage: 'LOOKUP(@{employeeId}, "employees")', result: 'Employee record', description: 'Find employee' },
      { usage: 'LOOKUP(@{code}, "products")', result: 'Product data', description: 'Product lookup' }
    ],
    tips: [
      'Data source must be configured in system',
      'Returns full record or specific field based on configuration'
    ],
    relatedFunctions: ['FIELD_VALUE', 'COALESCE']
  },

  'TYPE_OF': {
    name: 'TYPE_OF',
    syntax: 'TYPE_OF(field)',
    category: 'Utility',
    description: 'Get type of value',
    explanation: 'The TYPE_OF function returns the data type of a value as a string (e.g., "string", "number", "boolean", "array", "object", "null").',
    parameters: [
      { name: 'field', type: 'any', description: 'Value to check type of', required: true }
    ],
    examples: [
      { usage: 'TYPE_OF(@{value})', result: '"string"/"number"/etc', description: 'Get type' },
      { usage: 'TYPE_OF(123)', result: '"number"', description: 'Number type' },
      { usage: 'TYPE_OF(["a", "b"])', result: '"array"', description: 'Array type' }
    ],
    tips: [
      'Useful for conditional logic based on type',
      'Returns lowercase type names'
    ],
    relatedFunctions: ['IS_NUMBER', 'IS_EMPTY', 'IS_NULL']
  },

  'HASH': {
    name: 'HASH',
    syntax: 'HASH(field)',
    category: 'Utility',
    description: 'Generate hash of value',
    explanation: 'The HASH function generates a hash code from a value. Useful for creating unique identifiers or checksums.',
    parameters: [
      { name: 'field', type: 'any', description: 'Value to hash', required: true }
    ],
    examples: [
      { usage: 'HASH(@{data})', result: 'Hash string', description: 'Generate hash' },
      { usage: 'HASH(CONCAT(@{id}, @{timestamp}))', result: 'Unique hash', description: 'Composite hash' }
    ],
    tips: [
      'Same input always produces same hash',
      'Useful for change detection'
    ],
    relatedFunctions: ['UUID', 'ENCODE_BASE64']
  },

  // ==================== ARRAY FUNCTIONS ====================
  'ARRAY_LENGTH': {
    name: 'ARRAY_LENGTH',
    syntax: 'ARRAY_LENGTH(field)',
    category: 'Array',
    description: 'Get length of array',
    explanation: 'The ARRAY_LENGTH function returns the number of elements in an array.',
    parameters: [
      { name: 'field', type: 'array', description: 'Array to measure', required: true }
    ],
    examples: [
      { usage: 'ARRAY_LENGTH(@{items})', result: '5', description: 'Count items' },
      { usage: 'ARRAY_LENGTH(SPLIT(@{tags}, ","))', result: 'Count tags', description: 'Count comma-separated values' }
    ],
    tips: [
      'Returns 0 for empty array',
      'Returns undefined/null for non-arrays'
    ],
    relatedFunctions: ['LENGTH', 'COUNT', 'ARRAY_FIRST']
  },

  'ARRAY_FIRST': {
    name: 'ARRAY_FIRST',
    syntax: 'ARRAY_FIRST(field)',
    category: 'Array',
    description: 'Get first element of array',
    explanation: 'The ARRAY_FIRST function returns the first element of an array.',
    parameters: [
      { name: 'field', type: 'array', description: 'Array to get first element from', required: true }
    ],
    examples: [
      { usage: 'ARRAY_FIRST(@{options})', result: 'First option', description: 'Get first option' },
      { usage: 'ARRAY_FIRST(SPLIT(@{path}, "/"))', result: 'Root path', description: 'First path segment' }
    ],
    tips: [
      'Returns null/undefined for empty array',
      'Same as accessing index 0'
    ],
    relatedFunctions: ['ARRAY_LAST', 'ARRAY_LENGTH']
  },

  'ARRAY_LAST': {
    name: 'ARRAY_LAST',
    syntax: 'ARRAY_LAST(field)',
    category: 'Array',
    description: 'Get last element of array',
    explanation: 'The ARRAY_LAST function returns the last element of an array.',
    parameters: [
      { name: 'field', type: 'array', description: 'Array to get last element from', required: true }
    ],
    examples: [
      { usage: 'ARRAY_LAST(@{history})', result: 'Most recent', description: 'Get latest entry' },
      { usage: 'ARRAY_LAST(SPLIT(@{filename}, "."))', result: 'Extension', description: 'Get file extension' }
    ],
    relatedFunctions: ['ARRAY_FIRST', 'ARRAY_LENGTH']
  },

  'ARRAY_CONTAINS': {
    name: 'ARRAY_CONTAINS',
    syntax: 'ARRAY_CONTAINS(field, value)',
    category: 'Array',
    description: 'Check if array contains value',
    explanation: 'The ARRAY_CONTAINS function checks if an array includes a specific value.',
    parameters: [
      { name: 'field', type: 'array', description: 'Array to search in', required: true },
      { name: 'value', type: 'any', description: 'Value to find', required: true }
    ],
    examples: [
      { usage: 'ARRAY_CONTAINS(@{roles}, "ADMIN")', result: 'true/false', description: 'Check for admin role' },
      { usage: 'ARRAY_CONTAINS(@{tags}, @{searchTag})', result: 'true/false', description: 'Find tag' }
    ],
    tips: [
      'Case-sensitive for strings',
      'Use IN() for checking single value in list'
    ],
    relatedFunctions: ['IN', 'CONTAINS', 'ARRAY_LENGTH']
  },

  'ARRAY_UNIQUE': {
    name: 'ARRAY_UNIQUE',
    syntax: 'ARRAY_UNIQUE(field)',
    category: 'Array',
    description: 'Remove duplicates from array',
    explanation: 'The ARRAY_UNIQUE function returns a new array with duplicate values removed.',
    parameters: [
      { name: 'field', type: 'array', description: 'Array to deduplicate', required: true }
    ],
    examples: [
      { usage: 'ARRAY_UNIQUE(@{selections})', result: 'Unique values', description: 'Remove duplicates' },
      { usage: 'ARRAY_LENGTH(ARRAY_UNIQUE(@{items}))', result: 'Count unique', description: 'Count unique items' }
    ],
    relatedFunctions: ['ARRAY_SORT', 'ARRAY_LENGTH']
  },

  'ARRAY_SORT': {
    name: 'ARRAY_SORT',
    syntax: 'ARRAY_SORT(field)',
    category: 'Array',
    description: 'Sort array values',
    explanation: 'The ARRAY_SORT function returns a new array with elements sorted in ascending order.',
    parameters: [
      { name: 'field', type: 'array', description: 'Array to sort', required: true }
    ],
    examples: [
      { usage: 'ARRAY_SORT(@{numbers})', result: 'Sorted array', description: 'Sort ascending' },
      { usage: 'ARRAY_SORT(@{names})', result: 'Alphabetical', description: 'Sort strings' }
    ],
    tips: [
      'Numbers sort numerically',
      'Strings sort alphabetically'
    ],
    relatedFunctions: ['ARRAY_UNIQUE', 'ARRAY_FIRST', 'ARRAY_LAST']
  },

  // ==================== JSON FUNCTIONS ====================
  'JSON_GET': {
    name: 'JSON_GET',
    syntax: 'JSON_GET(field, path)',
    category: 'Utility',
    description: 'Get value from JSON path',
    explanation: 'The JSON_GET function retrieves a value from a JSON object using dot notation path.',
    parameters: [
      { name: 'field', type: 'object', description: 'JSON object', required: true },
      { name: 'path', type: 'string', description: 'Path to value (dot notation)', required: true }
    ],
    examples: [
      { usage: 'JSON_GET(@{data}, "user.name")', result: 'User name', description: 'Get nested value' },
      { usage: 'JSON_GET(@{config}, "settings.theme")', result: 'Theme value', description: 'Get setting' }
    ],
    tips: [
      'Use dot notation for nested paths',
      'Use brackets for array access: "items[0].name"'
    ],
    relatedFunctions: ['JSON_SET', 'FIELD_VALUE']
  },

  'JSON_SET': {
    name: 'JSON_SET',
    syntax: 'JSON_SET(field, path, value)',
    category: 'Utility',
    description: 'Set value in JSON',
    explanation: 'The JSON_SET function sets a value in a JSON object at the specified path.',
    parameters: [
      { name: 'field', type: 'object', description: 'JSON object', required: true },
      { name: 'path', type: 'string', description: 'Path to set (dot notation)', required: true },
      { name: 'value', type: 'any', description: 'Value to set', required: true }
    ],
    examples: [
      { usage: 'JSON_SET(@{data}, "status", "active")', result: 'Updated JSON', description: 'Set property' },
      { usage: 'JSON_SET(@{config}, "user.name", @{name})', result: 'Set nested', description: 'Set nested value' }
    ],
    relatedFunctions: ['JSON_GET', 'FIELD_VALUE']
  },

  // ==================== ENCODING FUNCTIONS ====================
  'ENCODE_BASE64': {
    name: 'ENCODE_BASE64',
    syntax: 'ENCODE_BASE64(field)',
    category: 'Utility',
    description: 'Encode to Base64',
    explanation: 'The ENCODE_BASE64 function encodes a string to Base64 format.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text to encode', required: true }
    ],
    examples: [
      { usage: 'ENCODE_BASE64(@{data})', result: 'Base64 string', description: 'Encode data' },
      { usage: 'ENCODE_BASE64("Hello")', result: '"SGVsbG8="', description: 'Encode text' }
    ],
    tips: [
      'Useful for encoding binary data as text',
      'Use DECODE_BASE64 to reverse'
    ],
    relatedFunctions: ['DECODE_BASE64', 'ENCODE_URL', 'HASH']
  },

  'DECODE_BASE64': {
    name: 'DECODE_BASE64',
    syntax: 'DECODE_BASE64(field)',
    category: 'Utility',
    description: 'Decode from Base64',
    explanation: 'The DECODE_BASE64 function decodes a Base64 encoded string back to its original text.',
    parameters: [
      { name: 'field', type: 'string', description: 'Base64 string to decode', required: true }
    ],
    examples: [
      { usage: 'DECODE_BASE64(@{encoded})', result: 'Original text', description: 'Decode data' },
      { usage: 'DECODE_BASE64("SGVsbG8=")', result: '"Hello"', description: 'Decode to text' }
    ],
    relatedFunctions: ['ENCODE_BASE64', 'DECODE_URL']
  },

  'ENCODE_URL': {
    name: 'ENCODE_URL',
    syntax: 'ENCODE_URL(field)',
    category: 'Utility',
    description: 'URL encode text',
    explanation: 'The ENCODE_URL function encodes special characters in a string for safe use in URLs.',
    parameters: [
      { name: 'field', type: 'string', description: 'Text to encode', required: true }
    ],
    examples: [
      { usage: 'ENCODE_URL(@{query})', result: 'URL-safe string', description: 'Encode for URL' },
      { usage: 'ENCODE_URL("hello world")', result: '"hello%20world"', description: 'Encode spaces' }
    ],
    tips: [
      'Encodes spaces, special characters',
      'Use for query string values'
    ],
    relatedFunctions: ['DECODE_URL', 'ENCODE_BASE64']
  },

  'DECODE_URL': {
    name: 'DECODE_URL',
    syntax: 'DECODE_URL(field)',
    category: 'Utility',
    description: 'URL decode text',
    explanation: 'The DECODE_URL function decodes URL-encoded characters back to their original form.',
    parameters: [
      { name: 'field', type: 'string', description: 'URL-encoded string to decode', required: true }
    ],
    examples: [
      { usage: 'DECODE_URL(@{urlParam})', result: 'Decoded text', description: 'Decode URL param' },
      { usage: 'DECODE_URL("hello%20world")', result: '"hello world"', description: 'Decode spaces' }
    ],
    relatedFunctions: ['ENCODE_URL', 'DECODE_BASE64']
  },

  // ==================== RANDOM FUNCTIONS ====================
  'RANDOM': {
    name: 'RANDOM',
    syntax: 'RANDOM()',
    category: 'Utility',
    description: 'Generate random number 0-1',
    explanation: 'The RANDOM function generates a random decimal number between 0 (inclusive) and 1 (exclusive).',
    parameters: [],
    examples: [
      { usage: 'RANDOM()', result: '0.7382...', description: 'Random decimal' },
      { usage: 'FLOOR(RANDOM() * 100)', result: '0-99', description: 'Random 0-99' }
    ],
    tips: [
      'Returns different value each time',
      'Use RANDOM_INT for integer ranges'
    ],
    relatedFunctions: ['RANDOM_INT', 'UUID']
  },

  'RANDOM_INT': {
    name: 'RANDOM_INT',
    syntax: 'RANDOM_INT(min, max)',
    category: 'Utility',
    description: 'Generate random integer',
    explanation: 'The RANDOM_INT function generates a random integer between min and max (inclusive).',
    parameters: [
      { name: 'min', type: 'number', description: 'Minimum value (inclusive)', required: true },
      { name: 'max', type: 'number', description: 'Maximum value (inclusive)', required: true }
    ],
    examples: [
      { usage: 'RANDOM_INT(1, 100)', result: '1-100', description: 'Random 1 to 100' },
      { usage: 'RANDOM_INT(1, 6)', result: 'Dice roll', description: 'Simulate dice' }
    ],
    tips: [
      'Both min and max are inclusive',
      'Returns integer, not decimal'
    ],
    relatedFunctions: ['RANDOM', 'UUID']
  },

  // ==================== CONDITIONAL FUNCTIONS ====================
  'SWITCH': {
    name: 'SWITCH',
    syntax: 'SWITCH(field, case1, val1, case2, val2, ..., default)',
    category: 'Boolean',
    description: 'Multi-case conditional',
    explanation: 'The SWITCH function compares a value against multiple cases and returns the corresponding result. Like a switch statement in programming.',
    parameters: [
      { name: 'field', type: 'any', description: 'Value to compare', required: true },
      { name: 'cases', type: 'pairs', description: 'Case/value pairs', required: true },
      { name: 'default', type: 'any', description: 'Default value if no match', required: false }
    ],
    examples: [
      { usage: 'SWITCH(@{status}, "A", "Active", "I", "Inactive", "Unknown")', result: 'Status text', description: 'Status lookup' },
      { usage: 'SWITCH(@{grade}, "A", 4, "B", 3, "C", 2, 0)', result: 'Grade points', description: 'Grade to points' }
    ],
    tips: [
      'More readable than nested IFs for value matching',
      'Last argument without a pair is the default'
    ],
    relatedFunctions: ['IF', 'IFS', 'COALESCE']
  },

  'TEMPLATE': {
    name: 'TEMPLATE',
    syntax: 'TEMPLATE(str, vars)',
    category: 'Utility',
    description: 'String template with variables',
    explanation: 'The TEMPLATE function replaces placeholders in a string with values from a variables object. Placeholders use {name} syntax.',
    parameters: [
      { name: 'str', type: 'string', description: 'Template string with {placeholders}', required: true },
      { name: 'vars', type: 'object', description: 'Object with variable values', required: true }
    ],
    examples: [
      { usage: 'TEMPLATE("Hello {name}!", {"name": @{firstName}})', result: '"Hello John!"', description: 'Simple template' },
      { usage: 'TEMPLATE("Order #{id} - {status}", {"id": @{orderId}, "status": @{orderStatus}})', result: '"Order #123 - Pending"', description: 'Multiple vars' }
    ],
    tips: [
      'Placeholders use {name} syntax',
      'Missing variables are replaced with empty string'
    ],
    relatedFunctions: ['CONCAT', 'REPLACE']
  }
};

// Helper function to get function definition by name
export function getFunctionDefinition(name: string): FunctionDefinition | undefined {
  // Try exact match first
  if (FUNCTION_DEFINITIONS[name]) {
    return FUNCTION_DEFINITIONS[name];
  }

  // Try extracting function name from syntax (e.g., "NOW()" -> "NOW")
  const baseName = name.replace(/\(.*\)/, '');
  return FUNCTION_DEFINITIONS[baseName];
}

// Get all function names
export function getAllFunctionNames(): string[] {
  return Object.keys(FUNCTION_DEFINITIONS);
}

// Get functions by category
export function getFunctionsByCategory(category: string): FunctionDefinition[] {
  return Object.values(FUNCTION_DEFINITIONS).filter(fn => fn.category === category);
}
