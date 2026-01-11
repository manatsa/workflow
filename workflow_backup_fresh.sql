--
-- PostgreSQL database dump
--

\restrict eIUgCOqKe2BRu6ZfB5thB2LeLV0HjU6U1iyrbz9Hfdp7kURAQwiPmw6hfc8f72G

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: approval_history; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.approval_history (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    action character varying(255) NOT NULL,
    action_date timestamp(6) without time zone,
    action_source character varying(255),
    approver_email character varying(255),
    approver_name character varying(255),
    comments text,
    ip_address character varying(255),
    level integer,
    user_agent character varying(255),
    approver_id uuid,
    workflow_instance_id uuid NOT NULL,
    CONSTRAINT approval_history_action_check CHECK (((action)::text = ANY ((ARRAY['SUBMITTED'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'ESCALATED'::character varying, 'CANCELLED'::character varying, 'RETURNED'::character varying, 'REASSIGNED'::character varying, 'RECALLED'::character varying])::text[]))),
    CONSTRAINT approval_history_action_source_check CHECK (((action_source)::text = ANY ((ARRAY['SYSTEM'::character varying, 'EMAIL'::character varying])::text[])))
);


ALTER TABLE public.approval_history OWNER TO sonar;

--
-- Name: attachments; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.attachments (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    content_type character varying(255),
    description character varying(255),
    encryption_iv character varying(255),
    file_path character varying(255) NOT NULL,
    file_size bigint,
    is_encrypted boolean,
    original_filename character varying(255) NOT NULL,
    stored_filename character varying(255) NOT NULL,
    uploaded_by character varying(255),
    workflow_instance_id uuid NOT NULL
);


ALTER TABLE public.attachments OWNER TO sonar;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    action character varying(255) NOT NULL,
    action_date timestamp(6) without time zone NOT NULL,
    changes text,
    entity_id uuid,
    entity_name character varying(255),
    entity_type character varying(255) NOT NULL,
    ip_address character varying(255),
    module character varying(255),
    new_values text,
    old_values text,
    session_id character varying(255),
    summary text,
    user_agent character varying(255),
    user_full_name character varying(255),
    user_id uuid,
    username character varying(255) NOT NULL,
    sbu_id uuid,
    workflow_instance_id uuid,
    CONSTRAINT audit_logs_action_check CHECK (((action)::text = ANY ((ARRAY['CREATE'::character varying, 'READ'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying, 'LOGIN'::character varying, 'LOGOUT'::character varying, 'PASSWORD_CHANGE'::character varying, 'PASSWORD_RESET'::character varying, 'SUBMIT'::character varying, 'APPROVE'::character varying, 'REJECT'::character varying, 'ESCALATE'::character varying, 'CANCEL'::character varying, 'LOCK'::character varying, 'UNLOCK'::character varying, 'IMPORT'::character varying, 'EXPORT'::character varying, 'BACKUP'::character varying, 'RESTORE'::character varying, 'SYSTEM_LOCK'::character varying, 'SYSTEM_UNLOCK'::character varying])::text[])))
);


ALTER TABLE public.audit_logs OWNER TO sonar;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.branches (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    address text,
    code character varying(255) NOT NULL,
    contact_email character varying(255),
    contact_phone character varying(255),
    description character varying(255),
    name character varying(255) NOT NULL,
    sbu_id uuid NOT NULL
);


ALTER TABLE public.branches OWNER TO sonar;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    code character varying(255) NOT NULL,
    description character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.categories OWNER TO sonar;

--
-- Name: corporates; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.corporates (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    address text,
    code character varying(255) NOT NULL,
    contact_email character varying(255),
    contact_phone character varying(255),
    corporate_type character varying(255),
    description character varying(255),
    name character varying(255) NOT NULL,
    website character varying(255),
    category_id uuid,
    CONSTRAINT corporates_corporate_type_check CHECK (((corporate_type)::text = ANY ((ARRAY['PRIVATE_LIMITED'::character varying, 'SOLE_TRADER'::character varying, 'PUBLIC'::character varying, 'PARTNERSHIP'::character varying, 'NGO'::character varying, 'GOVERNMENT'::character varying])::text[])))
);


ALTER TABLE public.corporates OWNER TO sonar;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.departments (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    code character varying(255) NOT NULL,
    contact_email character varying(255),
    contact_phone character varying(255),
    description character varying(255),
    head_of_department character varying(255),
    name character varying(255) NOT NULL,
    corporate_id uuid
);


ALTER TABLE public.departments OWNER TO sonar;

--
-- Name: email_approval_tokens; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.email_approval_tokens (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    action_type character varying(255),
    approval_level integer NOT NULL,
    approver_email character varying(255) NOT NULL,
    approver_name character varying(255),
    expires_at timestamp(6) without time zone NOT NULL,
    is_used boolean,
    token character varying(255) NOT NULL,
    used_at timestamp(6) without time zone,
    workflow_instance_id uuid NOT NULL,
    CONSTRAINT email_approval_tokens_action_type_check CHECK (((action_type)::text = ANY ((ARRAY['APPROVE'::character varying, 'REJECT'::character varying, 'VIEW'::character varying])::text[])))
);


ALTER TABLE public.email_approval_tokens OWNER TO sonar;

--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.email_settings (
    id bigint NOT NULL,
    api_endpoint character varying(500),
    api_key character varying(500),
    aws_access_key_id character varying(100),
    aws_region character varying(50),
    aws_secret_key character varying(500),
    connection_timeout integer,
    created_by character varying(50),
    created_date timestamp(6) without time zone,
    debug_mode boolean NOT NULL,
    email_enabled boolean NOT NULL,
    email_footer text,
    email_protocol character varying(30) NOT NULL,
    email_signature text,
    exchange_domain character varying(100),
    exchange_email character varying(255),
    exchange_password character varying(500),
    exchange_server_url character varying(500),
    exchange_username character varying(255),
    gmail_client_id character varying(255),
    gmail_client_secret character varying(500),
    gmail_refresh_token character varying(500),
    gmail_user_email character varying(255),
    include_company_logo boolean NOT NULL,
    last_test_date timestamp(6) without time zone,
    last_test_error text,
    last_test_success boolean,
    max_retries integer,
    ms_client_id character varying(100),
    ms_client_secret character varying(500),
    ms_tenant_id character varying(100),
    ms_user_email character varying(255),
    read_timeout integer,
    reply_to_email character varying(255),
    retry_delay_seconds integer,
    sender_email character varying(255),
    sender_name character varying(100),
    smtp_auth_required boolean NOT NULL,
    smtp_host character varying(255),
    smtp_password character varying(500),
    smtp_port integer,
    smtp_security character varying(20),
    smtp_username character varying(255),
    test_email_recipient character varying(255),
    updated_by character varying(50),
    updated_date timestamp(6) without time zone,
    use_ssl_trust_all boolean NOT NULL,
    write_timeout integer,
    CONSTRAINT email_settings_email_protocol_check CHECK (((email_protocol)::text = ANY ((ARRAY['SMTP'::character varying, 'SMTP_OFFICE365'::character varying, 'SMTP_GMAIL'::character varying, 'SMTP_OUTLOOK'::character varying, 'SMTP_YAHOO'::character varying, 'SMTP_EXCHANGE'::character varying, 'MICROSOFT_GRAPH'::character varying, 'GMAIL_API'::character varying, 'EXCHANGE_EWS'::character varying, 'SENDGRID'::character varying, 'MAILGUN'::character varying, 'AWS_SES'::character varying])::text[]))),
    CONSTRAINT email_settings_smtp_security_check CHECK (((smtp_security)::text = ANY ((ARRAY['NONE'::character varying, 'SSL'::character varying, 'TLS'::character varying])::text[])))
);


ALTER TABLE public.email_settings OWNER TO sonar;

--
-- Name: email_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: sonar
--

ALTER TABLE public.email_settings ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.email_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: field_groups; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.field_groups (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    columns integer,
    css_class character varying(255),
    description character varying(255),
    display_order integer,
    is_collapsed_by_default boolean,
    is_collapsible boolean,
    title character varying(255) NOT NULL,
    form_id uuid NOT NULL
);


ALTER TABLE public.field_groups OWNER TO sonar;

--
-- Name: field_options; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.field_options (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    color character varying(255),
    description character varying(255),
    display_order integer,
    icon character varying(255),
    is_default boolean,
    label character varying(255) NOT NULL,
    value character varying(255) NOT NULL,
    field_id uuid NOT NULL
);


ALTER TABLE public.field_options OWNER TO sonar;

--
-- Name: privileges; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.privileges (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    category character varying(255),
    description character varying(255),
    is_system_privilege boolean,
    name character varying(255) NOT NULL
);


ALTER TABLE public.privileges OWNER TO sonar;

--
-- Name: role_privileges; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.role_privileges (
    role_id uuid NOT NULL,
    privilege_id uuid NOT NULL
);


ALTER TABLE public.role_privileges OWNER TO sonar;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    description character varying(255),
    is_system_role boolean,
    name character varying(255) NOT NULL
);


ALTER TABLE public.roles OWNER TO sonar;

--
-- Name: sbus; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.sbus (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    address character varying(255),
    code character varying(255) NOT NULL,
    contact_email character varying(255),
    contact_phone character varying(255),
    description character varying(255),
    is_root boolean,
    name character varying(255) NOT NULL,
    corporate_id uuid,
    parent_id uuid
);


ALTER TABLE public.sbus OWNER TO sonar;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.settings (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    setting_category character varying(255),
    default_value character varying(255),
    description character varying(255),
    display_order integer,
    is_encrypted boolean,
    is_system boolean,
    setting_key character varying(255) NOT NULL,
    setting_label character varying(255),
    setting_options character varying(255),
    setting_tab character varying(255),
    setting_type character varying(255),
    validation_regex character varying(255),
    setting_value text,
    CONSTRAINT settings_setting_type_check CHECK (((setting_type)::text = ANY ((ARRAY['STRING'::character varying, 'NUMBER'::character varying, 'BOOLEAN'::character varying, 'COLOR'::character varying, 'EMAIL'::character varying, 'URL'::character varying, 'PASSWORD'::character varying, 'JSON'::character varying, 'LIST'::character varying, 'SELECT'::character varying])::text[])))
);


ALTER TABLE public.settings OWNER TO sonar;

--
-- Name: system_state; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.system_state (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    is_locked boolean,
    lock_reason character varying(255),
    locked_at timestamp(6) without time zone,
    locked_by character varying(255),
    maintenance_message text,
    maintenance_mode boolean
);


ALTER TABLE public.system_state OWNER TO sonar;

--
-- Name: user_branches; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.user_branches (
    user_id uuid NOT NULL,
    branch_id uuid NOT NULL
);


ALTER TABLE public.user_branches OWNER TO sonar;

--
-- Name: user_corporates; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.user_corporates (
    user_id uuid NOT NULL,
    corporate_id uuid NOT NULL
);


ALTER TABLE public.user_corporates OWNER TO sonar;

--
-- Name: user_departments; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.user_departments (
    user_id uuid NOT NULL,
    department_id uuid NOT NULL
);


ALTER TABLE public.user_departments OWNER TO sonar;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE public.user_roles OWNER TO sonar;

--
-- Name: user_sbus; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.user_sbus (
    user_id uuid NOT NULL,
    sbu_id uuid NOT NULL
);


ALTER TABLE public.user_sbus OWNER TO sonar;

--
-- Name: users; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    department character varying(255),
    email character varying(255) NOT NULL,
    failed_login_attempts integer,
    first_name character varying(255),
    is_locked boolean,
    last_login timestamp(6) without time zone,
    last_name character varying(255),
    lock_reason character varying(255),
    locked_at timestamp(6) without time zone,
    locked_by character varying(255),
    must_change_password boolean,
    password character varying(255) NOT NULL,
    password_changed_at timestamp(6) without time zone,
    password_reset_token character varying(255),
    password_reset_token_expiry timestamp(6) without time zone,
    phone_number character varying(255),
    profile_picture character varying(255),
    staff_id character varying(255),
    user_type character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    CONSTRAINT users_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['SYSTEM'::character varying, 'STAFF'::character varying, 'MANAGER'::character varying, 'EXTERNAL'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO sonar;

--
-- Name: workflow_approvers; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_approvers (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    approval_limit numeric(38,2),
    approver_email character varying(255),
    approver_name character varying(255),
    can_escalate boolean,
    display_order integer,
    escalation_timeout_hours integer,
    is_unlimited boolean,
    level integer NOT NULL,
    notify_on_approval boolean,
    notify_on_pending boolean,
    notify_on_rejection boolean,
    sbu_id uuid,
    user_id uuid,
    workflow_id uuid NOT NULL
);


ALTER TABLE public.workflow_approvers OWNER TO sonar;

--
-- Name: workflow_branches; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_branches (
    workflow_id uuid NOT NULL,
    branch_id uuid NOT NULL
);


ALTER TABLE public.workflow_branches OWNER TO sonar;

--
-- Name: workflow_corporates; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_corporates (
    workflow_id uuid NOT NULL,
    corporate_id uuid NOT NULL
);


ALTER TABLE public.workflow_corporates OWNER TO sonar;

--
-- Name: workflow_departments; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_departments (
    workflow_id uuid NOT NULL,
    department_id uuid NOT NULL
);


ALTER TABLE public.workflow_departments OWNER TO sonar;

--
-- Name: workflow_field_values; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_field_values (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    display_value text,
    field_label character varying(255),
    field_name character varying(255),
    old_value text,
    field_value text,
    field_id uuid NOT NULL,
    workflow_instance_id uuid NOT NULL
);


ALTER TABLE public.workflow_field_values OWNER TO sonar;

--
-- Name: workflow_fields; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_fields (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    allowed_file_types character varying(255),
    column_span integer,
    css_class character varying(255),
    custom_validation_message character varying(255),
    custom_validation_rule text,
    data_type character varying(255),
    default_value character varying(255),
    display_order integer,
    dropdown_display_field character varying(255),
    dropdown_source character varying(255),
    dropdown_value_field character varying(255),
    field_type character varying(255) NOT NULL,
    in_summary boolean,
    is_attachment boolean,
    is_hidden boolean,
    is_limited boolean,
    is_mandatory boolean,
    is_readonly boolean,
    is_searchable boolean,
    is_title boolean,
    is_unique boolean,
    label character varying(255) NOT NULL,
    max_file_size bigint,
    max_files integer,
    max_length integer,
    max_value character varying(255),
    min_length integer,
    min_value character varying(255),
    name character varying(255) NOT NULL,
    placeholder character varying(255),
    tooltip character varying(255),
    validation text,
    validation_message character varying(255),
    validation_regex character varying(255),
    width integer,
    field_group_id uuid,
    form_id uuid NOT NULL,
    CONSTRAINT workflow_fields_data_type_check CHECK (((data_type)::text = ANY ((ARRAY['NUMBER'::character varying, 'BOOLEAN'::character varying, 'ALPHANUMERIC'::character varying])::text[]))),
    CONSTRAINT workflow_fields_field_type_check CHECK (((field_type)::text = ANY ((ARRAY['TEXT'::character varying, 'TEXTAREA'::character varying, 'NUMBER'::character varying, 'CURRENCY'::character varying, 'DATE'::character varying, 'DATETIME'::character varying, 'CHECKBOX'::character varying, 'RADIO'::character varying, 'SELECT'::character varying, 'MULTISELECT'::character varying, 'FILE'::character varying, 'EMAIL'::character varying, 'PHONE'::character varying, 'URL'::character varying, 'PASSWORD'::character varying, 'HIDDEN'::character varying, 'LABEL'::character varying, 'DIVIDER'::character varying])::text[])))
);


ALTER TABLE public.workflow_fields OWNER TO sonar;

--
-- Name: workflow_forms; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_forms (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    description character varying(255),
    display_order integer,
    icon character varying(255),
    is_main_form boolean,
    name character varying(255) NOT NULL,
    workflow_id uuid NOT NULL
);


ALTER TABLE public.workflow_forms OWNER TO sonar;

--
-- Name: workflow_instances; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_instances (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    amount numeric(38,2),
    completed_at timestamp(6) without time zone,
    current_approver_order integer,
    current_level integer,
    reference_number character varying(255),
    status character varying(255) NOT NULL,
    submitted_at timestamp(6) without time zone,
    summary text,
    title character varying(255),
    current_approver_id uuid,
    initiator_id uuid,
    sbu_id uuid,
    workflow_id uuid NOT NULL,
    CONSTRAINT workflow_instances_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'ESCALATED'::character varying, 'CANCELLED'::character varying, 'ON_HOLD'::character varying])::text[])))
);


ALTER TABLE public.workflow_instances OWNER TO sonar;

--
-- Name: workflow_sbus; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_sbus (
    workflow_id uuid NOT NULL,
    sbu_id uuid NOT NULL
);


ALTER TABLE public.workflow_sbus OWNER TO sonar;

--
-- Name: workflow_types; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflow_types (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    code character varying(255) NOT NULL,
    color character varying(255),
    description character varying(255),
    display_order integer,
    icon character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.workflow_types OWNER TO sonar;

--
-- Name: workflows; Type: TABLE; Schema: public; Owner: sonar
--

CREATE TABLE public.workflows (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    is_active boolean,
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    code character varying(255) NOT NULL,
    comments_mandatory boolean,
    comments_mandatory_on_escalate boolean,
    comments_mandatory_on_reject boolean,
    description text,
    display_order integer,
    icon character varying(255),
    is_published boolean,
    name character varying(255) NOT NULL,
    requires_approval boolean,
    version_number integer,
    workflow_category character varying(255),
    workflow_type_id uuid,
    CONSTRAINT workflows_workflow_category_check CHECK (((workflow_category)::text = ANY ((ARRAY['FINANCIAL'::character varying, 'NON_FINANCIAL'::character varying])::text[])))
);


ALTER TABLE public.workflows OWNER TO sonar;

--
-- Data for Name: approval_history; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.approval_history (id, created_at, created_by, is_active, updated_at, updated_by, version, action, action_date, action_source, approver_email, approver_name, comments, ip_address, level, user_agent, approver_id, workflow_instance_id) FROM stdin;
\.


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.attachments (id, created_at, created_by, is_active, updated_at, updated_by, version, content_type, description, encryption_iv, file_path, file_size, is_encrypted, original_filename, stored_filename, uploaded_by, workflow_instance_id) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.audit_logs (id, created_at, created_by, is_active, updated_at, updated_by, version, action, action_date, changes, entity_id, entity_name, entity_type, ip_address, module, new_values, old_values, session_id, summary, user_agent, user_full_name, user_id, username, sbu_id, workflow_instance_id) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.branches (id, created_at, created_by, is_active, updated_at, updated_by, version, address, code, contact_email, contact_phone, description, name, sbu_id) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.categories (id, created_at, created_by, is_active, updated_at, updated_by, version, code, description, name) FROM stdin;
\.


--
-- Data for Name: corporates; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.corporates (id, created_at, created_by, is_active, updated_at, updated_by, version, address, code, contact_email, contact_phone, corporate_type, description, name, website, category_id) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.departments (id, created_at, created_by, is_active, updated_at, updated_by, version, code, contact_email, contact_phone, description, head_of_department, name, corporate_id) FROM stdin;
\.


--
-- Data for Name: email_approval_tokens; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.email_approval_tokens (id, created_at, created_by, is_active, updated_at, updated_by, version, action_type, approval_level, approver_email, approver_name, expires_at, is_used, token, used_at, workflow_instance_id) FROM stdin;
\.


--
-- Data for Name: email_settings; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.email_settings (id, api_endpoint, api_key, aws_access_key_id, aws_region, aws_secret_key, connection_timeout, created_by, created_date, debug_mode, email_enabled, email_footer, email_protocol, email_signature, exchange_domain, exchange_email, exchange_password, exchange_server_url, exchange_username, gmail_client_id, gmail_client_secret, gmail_refresh_token, gmail_user_email, include_company_logo, last_test_date, last_test_error, last_test_success, max_retries, ms_client_id, ms_client_secret, ms_tenant_id, ms_user_email, read_timeout, reply_to_email, retry_delay_seconds, sender_email, sender_name, smtp_auth_required, smtp_host, smtp_password, smtp_port, smtp_security, smtp_username, test_email_recipient, updated_by, updated_date, use_ssl_trust_all, write_timeout) FROM stdin;
\.


--
-- Data for Name: field_groups; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.field_groups (id, created_at, created_by, is_active, updated_at, updated_by, version, columns, css_class, description, display_order, is_collapsed_by_default, is_collapsible, title, form_id) FROM stdin;
\.


--
-- Data for Name: field_options; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.field_options (id, created_at, created_by, is_active, updated_at, updated_by, version, color, description, display_order, icon, is_default, label, value, field_id) FROM stdin;
\.


--
-- Data for Name: privileges; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.privileges (id, created_at, created_by, is_active, updated_at, updated_by, version, category, description, is_system_privilege, name) FROM stdin;
c45ea749-b9d6-4e36-9616-94a5c44b4105	2026-01-11 17:59:57.913925	system	t	2026-01-11 17:59:57.913925	system	0	System	Full administrative access	t	ADMIN
14185835-1ea7-4110-a568-91fff04361df	2026-01-11 17:59:57.93596	system	t	2026-01-11 17:59:57.93596	system	0	System	System level access for lock/unlock	t	SYSTEM
fe76e611-b72a-4ce3-a014-ada825ceaf59	2026-01-11 17:59:57.939959	system	t	2026-01-11 17:59:57.939959	system	0	Workflow	Create and manage workflows	f	WORKFLOW_BUILDER
2e95dbbd-3b96-4a5c-9ff6-7b1882a87e18	2026-01-11 17:59:57.945093	system	t	2026-01-11 17:59:57.945093	system	0	Workflow	Approve workflow instances	f	WORKFLOW_APPROVER
c815f75c-3bd1-400d-87ed-34a8927e5ccd	2026-01-11 17:59:57.948092	system	t	2026-01-11 17:59:57.948092	system	0	Admin	Manage users	f	USER_MANAGEMENT
b70233af-9cf0-4096-b35d-2dc4151922d3	2026-01-11 17:59:57.951035	system	t	2026-01-11 17:59:57.951035	system	0	Admin	Manage roles	f	ROLE_MANAGEMENT
8926a48b-ee57-45d0-a9a1-154d22c23016	2026-01-11 17:59:57.953041	system	t	2026-01-11 17:59:57.953041	system	0	Admin	Manage SBUs	f	SBU_MANAGEMENT
304bbc0c-226b-4acf-a1b1-042e40fc2f46	2026-01-11 17:59:57.95504	system	t	2026-01-11 17:59:57.95504	system	0	Admin	Manage settings	f	SETTINGS_MANAGEMENT
c1e86441-1dbc-4f38-8367-411fdcc3acf6	2026-01-11 17:59:57.958034	system	t	2026-01-11 17:59:57.958034	system	0	Admin	View audit logs	f	AUDIT_VIEW
7a723f59-2ab2-4507-bae2-8b838aa8d88a	2026-01-11 17:59:57.96004	system	t	2026-01-11 17:59:57.96004	system	0	Reporting	View reports	f	REPORT_VIEW
0b97e7c5-b3a3-4b9e-90ba-b98df3b098b3	2026-01-11 17:59:57.963036	system	t	2026-01-11 17:59:57.963036	system	0	Data	Import and export data	f	IMPORT_EXPORT
\.


--
-- Data for Name: role_privileges; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.role_privileges (role_id, privilege_id) FROM stdin;
85a67ca5-ef7f-4163-abe3-deae1d970c0a	c45ea749-b9d6-4e36-9616-94a5c44b4105
85a67ca5-ef7f-4163-abe3-deae1d970c0a	14185835-1ea7-4110-a568-91fff04361df
3a68e25e-345b-466a-a914-9e4402c75c20	fe76e611-b72a-4ce3-a014-ada825ceaf59
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.roles (id, created_at, created_by, is_active, updated_at, updated_by, version, description, is_system_role, name) FROM stdin;
85a67ca5-ef7f-4163-abe3-deae1d970c0a	2026-01-11 17:59:57.987501	system	t	2026-01-11 17:59:57.987501	system	0	Administrator role with full access	t	ROLE_ADMIN
f684f09b-0d45-42de-985f-33bb289cbaeb	2026-01-11 17:59:58.004533	system	t	2026-01-11 17:59:58.004533	system	0	Standard user role	t	ROLE_USER
3a68e25e-345b-466a-a914-9e4402c75c20	2026-01-11 17:59:58.010501	system	t	2026-01-11 17:59:58.010501	system	0	Workflow builder role	t	ROLE_WORKFLOW_BUILDER
\.


--
-- Data for Name: sbus; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.sbus (id, created_at, created_by, is_active, updated_at, updated_by, version, address, code, contact_email, contact_phone, description, is_root, name, corporate_id, parent_id) FROM stdin;
5a9b0b18-045e-4a9f-9779-1214176bbfc8	2026-01-11 17:59:58.382385	system	t	2026-01-11 17:59:58.382385	system	0	\N	HO	\N	\N	Main headquarters	t	Head Office	\N	\N
24c14584-b740-47ad-a795-29bd0de40ebe	2026-01-11 17:59:58.390385	system	t	2026-01-11 17:59:58.390385	system	0	\N	NORTH	\N	\N	Northern regional office	f	North Region	\N	5a9b0b18-045e-4a9f-9779-1214176bbfc8
1dcecb85-b9dc-44b1-be46-329e42044b67	2026-01-11 17:59:58.394385	system	t	2026-01-11 17:59:58.394385	system	0	\N	SOUTH	\N	\N	Southern regional office	f	South Region	\N	5a9b0b18-045e-4a9f-9779-1214176bbfc8
f11ca99f-5f95-40b6-8f89-c7514e366fd9	2026-01-11 17:59:58.397385	system	t	2026-01-11 17:59:58.397385	system	0	\N	EAST	\N	\N	Eastern regional office	f	East Region	\N	5a9b0b18-045e-4a9f-9779-1214176bbfc8
58d1202b-6e6c-462e-870e-c8c8389a8d43	2026-01-11 17:59:58.400385	system	t	2026-01-11 17:59:58.400385	system	0	\N	WEST	\N	\N	Western regional office	f	West Region	\N	5a9b0b18-045e-4a9f-9779-1214176bbfc8
12da0f11-562f-468c-bac7-64acbc334ca3	2026-01-11 17:59:58.402384	system	t	2026-01-11 17:59:58.402384	system	0	\N	NORTH-BR1	\N	\N	First branch in North region	f	North Branch 1	\N	24c14584-b740-47ad-a795-29bd0de40ebe
8cf4c7d0-a4a5-4758-8942-e6ee2e12b136	2026-01-11 17:59:58.404384	system	t	2026-01-11 17:59:58.404384	system	0	\N	NORTH-BR2	\N	\N	Second branch in North region	f	North Branch 2	\N	24c14584-b740-47ad-a795-29bd0de40ebe
e8f96a58-acbd-4519-bc03-c60674bda191	2026-01-11 17:59:58.407385	system	t	2026-01-11 17:59:58.407385	system	0	\N	SOUTH-BR1	\N	\N	First branch in South region	f	South Branch 1	\N	1dcecb85-b9dc-44b1-be46-329e42044b67
9a216bf5-4507-40ac-98d1-8e4732e3b1b7	2026-01-11 17:59:58.409384	system	t	2026-01-11 17:59:58.409384	system	0	\N	SOUTH-BR2	\N	\N	Second branch in South region	f	South Branch 2	\N	1dcecb85-b9dc-44b1-be46-329e42044b67
9808bb9e-7873-4688-b690-0981bc17d0df	2026-01-11 17:59:58.411384	system	t	2026-01-11 17:59:58.411384	system	0	\N	EAST-BR1	\N	\N	First branch in East region	f	East Branch 1	\N	f11ca99f-5f95-40b6-8f89-c7514e366fd9
c3b550c9-bee4-4338-b594-30d9f9c218b8	2026-01-11 17:59:58.414385	system	t	2026-01-11 17:59:58.414385	system	0	\N	WEST-BR1	\N	\N	First branch in West region	f	West Branch 1	\N	58d1202b-6e6c-462e-870e-c8c8389a8d43
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.settings (id, created_at, created_by, is_active, updated_at, updated_by, version, setting_category, default_value, description, display_order, is_encrypted, is_system, setting_key, setting_label, setting_options, setting_tab, setting_type, validation_regex, setting_value) FROM stdin;
3181024e-8690-4c9a-a670-38d644fd2e1e	2026-01-11 17:59:58.157528	system	t	2026-01-11 17:59:58.157528	system	0	General	\N	\N	\N	\N	t	app.name	Application Name	\N	General	STRING	\N	Sonarworks Workflow System
bb4bf5e0-8518-4a2b-b885-117c31662ed3	2026-01-11 17:59:58.163532	system	t	2026-01-11 17:59:58.163532	system	0	General	\N	\N	\N	\N	t	app.base.url	Application Base URL	\N	General	URL	\N	http://localhost:4200
20a6591d-f7cf-4cce-9fd9-00e7a32f8501	2026-01-11 17:59:58.167534	system	t	2026-01-11 17:59:58.167534	system	0	General	\N	\N	\N	\N	t	app.logo.url	Logo URL	\N	General	URL	\N	
9547ff3a-833d-49f4-97f5-094a6d840f8d	2026-01-11 17:59:58.170528	system	t	2026-01-11 17:59:58.170528	system	0	Server Configuration	\N	\N	\N	\N	t	mail.host	SMTP Server Host	\N	Mail Settings	STRING	\N	smtp.gmail.com
6247b6d0-63d5-4fc7-a0ab-bbf8a0aca541	2026-01-11 17:59:58.174534	system	t	2026-01-11 17:59:58.174534	system	0	Server Configuration	\N	\N	\N	\N	t	mail.port	SMTP Server Port	\N	Mail Settings	NUMBER	\N	587
8f47a348-fd24-4595-b2f4-612f7139c44b	2026-01-11 17:59:58.176529	system	t	2026-01-11 17:59:58.176529	system	0	Server Configuration	\N	\N	\N	\N	t	mail.protocol	Mail Protocol	smtp,smtps,imap,imaps,pop3,pop3s	Mail Settings	SELECT	\N	smtp
20b8eadf-612d-4e3d-8e10-8363e297b5ea	2026-01-11 17:59:58.179528	system	t	2026-01-11 17:59:58.179528	system	0	Server Configuration	\N	\N	\N	\N	t	mail.username	SMTP Username	\N	Mail Settings	STRING	\N	
bc382105-a96e-4695-89e8-876ba4e55f88	2026-01-11 17:59:58.182528	system	t	2026-01-11 17:59:58.182528	system	0	Server Configuration	\N	\N	\N	\N	t	mail.password	SMTP Password	\N	Mail Settings	PASSWORD	\N	
84ee385c-3069-436f-8cda-7d8c5a5dc754	2026-01-11 17:59:58.185527	system	t	2026-01-11 17:59:58.185527	system	0	Sender Information	\N	\N	\N	\N	t	mail.from.address	From Email Address	\N	Mail Settings	EMAIL	\N	noreply@sonarworks.com
73b3b5fc-5394-48ec-8711-854e576af770	2026-01-11 17:59:58.188528	system	t	2026-01-11 17:59:58.188528	system	0	Sender Information	\N	\N	\N	\N	t	mail.from.name	From Name	\N	Mail Settings	STRING	\N	Sonarworks Workflow
e7dbad66-c60d-4ae7-8aca-4143ddd28aea	2026-01-11 17:59:58.19253	system	t	2026-01-11 17:59:58.19253	system	0	Sender Information	\N	\N	\N	\N	t	mail.reply.to	Reply-To Address	\N	Mail Settings	EMAIL	\N	
c705747c-b9d0-499b-a7ec-5ea253c22fae	2026-01-11 17:59:58.195528	system	t	2026-01-11 17:59:58.195528	system	0	Security	\N	\N	\N	\N	t	mail.smtp.auth	SMTP Authentication Required	\N	Mail Settings	BOOLEAN	\N	true
d5c6de89-175c-4477-97e4-84dbd8b1421c	2026-01-11 17:59:58.197528	system	t	2026-01-11 17:59:58.197528	system	0	Security	\N	\N	\N	\N	t	mail.smtp.starttls.enable	Enable STARTTLS	\N	Mail Settings	BOOLEAN	\N	true
83c820ca-712f-4de7-8c53-3c6f20a96ba4	2026-01-11 17:59:58.200528	system	t	2026-01-11 17:59:58.200528	system	0	Security	\N	\N	\N	\N	t	mail.smtp.ssl.enable	Enable SSL	\N	Mail Settings	BOOLEAN	\N	false
35b75765-a3a9-46fd-a780-d224269db9d3	2026-01-11 17:59:58.202528	system	t	2026-01-11 17:59:58.202528	system	0	Security	\N	\N	\N	\N	t	mail.smtp.ssl.trust	SSL Trust (hostname or *)	\N	Mail Settings	STRING	\N	
355ad9af-daa7-4cf2-b49f-d8a43f77e2f7	2026-01-11 17:59:58.204529	system	t	2026-01-11 17:59:58.204529	system	0	Timeouts	\N	\N	\N	\N	t	mail.smtp.connectiontimeout	Connection Timeout (ms)	\N	Mail Settings	NUMBER	\N	5000
826aa1d9-4cf5-4a39-8882-29e729e059ec	2026-01-11 17:59:58.208528	system	t	2026-01-11 17:59:58.208528	system	0	Timeouts	\N	\N	\N	\N	t	mail.smtp.timeout	Read Timeout (ms)	\N	Mail Settings	NUMBER	\N	5000
c5b8b5cd-f616-417f-b8f3-ada31ce7e327	2026-01-11 17:59:58.213529	system	t	2026-01-11 17:59:58.213529	system	0	Timeouts	\N	\N	\N	\N	t	mail.smtp.writetimeout	Write Timeout (ms)	\N	Mail Settings	NUMBER	\N	5000
ea9f8052-79c4-4d56-8f1f-ca5254254bda	2026-01-11 17:59:58.215527	system	t	2026-01-11 17:59:58.215527	system	0	Features	\N	\N	\N	\N	t	mail.enabled	Email Notifications Enabled	\N	Mail Settings	BOOLEAN	\N	true
e97e4977-5e9c-40ec-8060-47b95010876c	2026-01-11 17:59:58.217527	system	t	2026-01-11 17:59:58.217527	system	0	Features	\N	\N	\N	\N	t	mail.debug	Debug Mode (logs mail details)	\N	Mail Settings	BOOLEAN	\N	false
03f4a89b-5571-4014-a6cd-fc678055114f	2026-01-11 17:59:58.219528	system	t	2026-01-11 17:59:58.219528	system	0	Features	\N	\N	\N	\N	t	mail.test.recipient	Test Email Recipient	\N	Mail Settings	EMAIL	\N	
36938840-eae8-45d5-8b4f-46ca006f5161	2026-01-11 17:59:58.222528	system	t	2026-01-11 17:59:58.222528	system	0	Password	\N	\N	\N	\N	t	password.min.length	Minimum Password Length	\N	User Settings	NUMBER	\N	8
a627d042-44b5-4c8f-aab2-a9dc2d0195cc	2026-01-11 17:59:58.224536	system	t	2026-01-11 17:59:58.224536	system	0	Password	\N	\N	\N	\N	t	password.max.length	Maximum Password Length	\N	User Settings	NUMBER	\N	128
4fae6512-2e11-4dd2-9e32-46e1312fbfcf	2026-01-11 17:59:58.226528	system	t	2026-01-11 17:59:58.226528	system	0	Password	\N	\N	\N	\N	t	password.require.uppercase	Require Uppercase Letters	\N	User Settings	BOOLEAN	\N	true
4abfba0b-9ed7-47c1-921a-066e2d295761	2026-01-11 17:59:58.228536	system	t	2026-01-11 17:59:58.228536	system	0	Password	\N	\N	\N	\N	t	password.require.lowercase	Require Lowercase Letters	\N	User Settings	BOOLEAN	\N	true
9dc53b4c-449b-407a-8bbf-747633094257	2026-01-11 17:59:58.230533	system	t	2026-01-11 17:59:58.230533	system	0	Password	\N	\N	\N	\N	t	password.require.numbers	Require Numbers	\N	User Settings	BOOLEAN	\N	true
be5b9e74-4c2c-4751-a95b-9001e1bebbf1	2026-01-11 17:59:58.232533	system	t	2026-01-11 17:59:58.232533	system	0	Password	\N	\N	\N	\N	t	password.require.special	Require Special Characters	\N	User Settings	BOOLEAN	\N	true
206bda1e-de9c-441d-beca-04de8fe36ba2	2026-01-11 17:59:58.23354	system	t	2026-01-11 17:59:58.23354	system	0	Password	\N	\N	\N	\N	t	password.special.chars	Allowed Special Characters	\N	User Settings	STRING	\N	!@#$%^&*()_+-=[]{}|;':",./<>?
fc01fef6-80aa-4461-8273-dde268a59f66	2026-01-11 17:59:58.235534	system	t	2026-01-11 17:59:58.235534	system	0	Password	\N	\N	\N	\N	t	password.lock.max.attempts	Max Failed Login Attempts	\N	User Settings	NUMBER	\N	5
ef24904c-ac71-4d45-8b85-9788912682c3	2026-01-11 17:59:58.246047	system	t	2026-01-11 17:59:58.246047	system	0	Password	\N	\N	\N	\N	t	password.reset.token.expiry.hours	Password Reset Token Expiry (hours)	\N	User Settings	NUMBER	\N	24
77e35c16-86b4-4acf-a6de-2f1aa63357a6	2026-01-11 17:59:58.248048	system	t	2026-01-11 17:59:58.248048	system	0	Password	\N	\N	\N	\N	t	password.change.days	Force Password Change After (days)	\N	User Settings	NUMBER	\N	90
561dec29-ec76-4066-9db2-a8b644446544	2026-01-11 17:59:58.250049	system	t	2026-01-11 17:59:58.250049	system	0	Brand Colors	\N	\N	\N	\N	t	theme.primary.color	Primary Color	\N	Theme Settings	COLOR	\N	#1976d2
12c6f5b9-580c-409a-9933-3167b779c480	2026-01-11 17:59:58.253049	system	t	2026-01-11 17:59:58.253049	system	0	Brand Colors	\N	\N	\N	\N	t	theme.secondary.color	Secondary Color	\N	Theme Settings	COLOR	\N	#424242
dd4f7480-4387-45d7-a67e-f05eaa7268b8	2026-01-11 17:59:58.256048	system	t	2026-01-11 17:59:58.256048	system	0	Brand Colors	\N	\N	\N	\N	t	theme.accent.color	Accent Color	\N	Theme Settings	COLOR	\N	#ff4081
100ae324-65fd-4a7b-bcb2-bc5f32a1242c	2026-01-11 17:59:58.258053	system	t	2026-01-11 17:59:58.258053	system	0	Brand Colors	\N	\N	\N	\N	t	theme.brand.color	Brand Color	\N	Theme Settings	COLOR	\N	#1976d2
612116c2-eb0b-4e13-8e2f-b93487b31a28	2026-01-11 17:59:58.261048	system	t	2026-01-11 17:59:58.261048	system	0	Sidebar	\N	\N	\N	\N	t	theme.sidebar.bg	Sidebar Background	\N	Theme Settings	COLOR	\N	#263238
89542b39-a04d-458f-a9ba-88f473ea2824	2026-01-11 17:59:58.263047	system	t	2026-01-11 17:59:58.263047	system	0	Sidebar	\N	\N	\N	\N	t	theme.sidebar.text	Sidebar Text Color	\N	Theme Settings	COLOR	\N	#ffffff
330a9321-d35a-48e1-861f-a0cfcc19c16f	2026-01-11 17:59:58.264049	system	t	2026-01-11 17:59:58.264049	system	0	Sidebar	\N	\N	\N	\N	t	theme.sidebar.header.bg	Sidebar Header Background	\N	Theme Settings	COLOR	\N	#1e272c
46a74bd8-4cda-4782-a64c-d44e1d3601a5	2026-01-11 17:59:58.266048	system	t	2026-01-11 17:59:58.266048	system	0	Sidebar	\N	\N	\N	\N	t	theme.sidebar.footer.bg	Sidebar Footer Background	\N	Theme Settings	COLOR	\N	#1e272c
2ca1a0de-778e-450e-8d7a-b7aa8a3bf8dd	2026-01-11 17:59:58.268047	system	t	2026-01-11 17:59:58.268047	system	0	Sidebar	\N	\N	\N	\N	t	theme.user.profile.bg	User Profile Area Background	\N	Theme Settings	COLOR	\N	#1e272c
55570428-daf4-4ac9-8325-c603a95faafe	2026-01-11 17:59:58.270049	system	t	2026-01-11 17:59:58.270049	system	0	Sidebar	\N	\N	\N	\N	t	theme.user.profile.text	User Profile Text Color	\N	Theme Settings	COLOR	\N	#ffffff
aafc336a-b76b-497b-976f-8227c650eb41	2026-01-11 17:59:58.272048	system	t	2026-01-11 17:59:58.272048	system	0	Sidebar	\N	\N	\N	\N	t	theme.menu.active.bg	Menu Active Background	\N	Theme Settings	COLOR	\N	#1976d2
ed6d8eaa-08a6-42f2-8131-4019b6bd1a3b	2026-01-11 17:59:58.275049	system	t	2026-01-11 17:59:58.275049	system	0	Sidebar	\N	\N	\N	\N	t	theme.menu.hover.bg	Menu Hover Background	\N	Theme Settings	COLOR	\N	#37474f
6982eb92-6dbe-4fb7-8977-0a115557c225	2026-01-11 17:59:58.278048	system	t	2026-01-11 17:59:58.278048	system	0	Header & Body	\N	\N	\N	\N	t	theme.header.bg	Main Header Background	\N	Theme Settings	COLOR	\N	#ffffff
97c19d04-d01b-4894-be31-7dd3923aed41	2026-01-11 17:59:58.28005	system	t	2026-01-11 17:59:58.28005	system	0	Header & Body	\N	\N	\N	\N	t	theme.header.text	Main Header Text Color	\N	Theme Settings	COLOR	\N	#333333
14ae2d16-1f5f-4555-90c3-40488a506a76	2026-01-11 17:59:58.282048	system	t	2026-01-11 17:59:58.282048	system	0	Header & Body	\N	\N	\N	\N	t	theme.body.bg	Body Background	\N	Theme Settings	COLOR	\N	#f5f5f5
0629d93c-fa90-48d7-bab9-5699742431d4	2026-01-11 17:59:58.28505	system	t	2026-01-11 17:59:58.28505	system	0	Header & Body	\N	\N	\N	\N	t	theme.card.bg	Card Background	\N	Theme Settings	COLOR	\N	#ffffff
7df61a60-05e8-401c-b37d-100e3d3ff1cf	2026-01-11 17:59:58.288048	system	t	2026-01-11 17:59:58.288048	system	0	Header & Body	\N	\N	\N	\N	t	theme.border.color	Border Color	\N	Theme Settings	COLOR	\N	#e0e0e0
c2e31251-bd01-40e0-910c-7792ffabaff3	2026-01-11 17:59:58.291048	system	t	2026-01-11 17:59:58.291048	system	0	Status Colors	\N	\N	\N	\N	t	theme.success.color	Success Color	\N	Theme Settings	COLOR	\N	#4caf50
578b0052-b1d5-435f-9a9f-6cf4d2901406	2026-01-11 17:59:58.293048	system	t	2026-01-11 17:59:58.293048	system	0	Status Colors	\N	\N	\N	\N	t	theme.warning.color	Warning Color	\N	Theme Settings	COLOR	\N	#ff9800
0a1168c7-c557-484b-8b75-d68d2eba8e55	2026-01-11 17:59:58.295049	system	t	2026-01-11 17:59:58.295049	system	0	Status Colors	\N	\N	\N	\N	t	theme.error.color	Error Color	\N	Theme Settings	COLOR	\N	#f44336
1e6bfb8e-a09a-487d-97d5-299783f2fb71	2026-01-11 17:59:58.297049	system	t	2026-01-11 17:59:58.297049	system	0	Status Colors	\N	\N	\N	\N	t	theme.info.color	Info Color	\N	Theme Settings	COLOR	\N	#2196f3
96ff893e-8556-4f43-9463-4abf7692a9e4	2026-01-11 17:59:58.298048	system	t	2026-01-11 17:59:58.298048	system	0	Badges	\N	\N	\N	\N	t	theme.badge.pending.bg	Pending Badge Background	\N	Theme Settings	COLOR	\N	#ff9800
3765eb3d-ef61-4a38-802e-ae1880bc8465	2026-01-11 17:59:58.300049	system	t	2026-01-11 17:59:58.300049	system	0	Badges	\N	\N	\N	\N	t	theme.badge.approved.bg	Approved Badge Background	\N	Theme Settings	COLOR	\N	#4caf50
5bc07193-9e2a-4725-99d1-a4eeaca85b64	2026-01-11 17:59:58.302048	system	t	2026-01-11 17:59:58.302048	system	0	Badges	\N	\N	\N	\N	t	theme.badge.rejected.bg	Rejected Badge Background	\N	Theme Settings	COLOR	\N	#f44336
97e23f8e-8aba-49be-95b5-3770225004a3	2026-01-11 17:59:58.304058	system	t	2026-01-11 17:59:58.304058	system	0	Tables	\N	\N	\N	\N	t	theme.table.header.bg	Table Header Background	\N	Theme Settings	COLOR	\N	#f5f5f5
d1e6cfe8-4231-48d1-a5e8-d49fd82a94db	2026-01-11 17:59:58.307049	system	t	2026-01-11 17:59:58.307049	system	0	Tables	\N	\N	\N	\N	t	theme.table.stripe.bg	Table Stripe Background	\N	Theme Settings	COLOR	\N	#fafafa
aebf5554-0ebb-426a-96ac-77957b5b337b	2026-01-11 17:59:58.309049	system	t	2026-01-11 17:59:58.309049	system	0	Buttons	\N	\N	\N	\N	t	theme.button.primary.bg	Primary Button Background	\N	Theme Settings	COLOR	\N	#1976d2
b6bd76fa-57ff-41b1-b78c-57a48e23f5db	2026-01-11 17:59:58.311048	system	t	2026-01-11 17:59:58.311048	system	0	Buttons	\N	\N	\N	\N	t	theme.button.primary.text	Primary Button Text	\N	Theme Settings	COLOR	\N	#ffffff
4a8cfc1f-12c8-4362-8dcc-45ee6517dedc	2026-01-11 17:59:58.313048	system	t	2026-01-11 17:59:58.313048	system	0	Buttons	\N	\N	\N	\N	t	theme.button.secondary.bg	Secondary Button Background	\N	Theme Settings	COLOR	\N	#757575
823de18e-b988-4499-ad81-27dce9182733	2026-01-11 17:59:58.315048	system	t	2026-01-11 17:59:58.315048	system	0	Buttons	\N	\N	\N	\N	t	theme.button.secondary.text	Secondary Button Text	\N	Theme Settings	COLOR	\N	#ffffff
01f7fbfd-dc30-4cdc-b4d3-667bc4ee83ce	2026-01-11 17:59:58.317047	system	t	2026-01-11 17:59:58.317047	system	0	Links & Inputs	\N	\N	\N	\N	t	theme.link.color	Link Color	\N	Theme Settings	COLOR	\N	#1976d2
cf987f3a-ddc3-4880-8876-8e8fa68f1bc2	2026-01-11 17:59:58.319049	system	t	2026-01-11 17:59:58.319049	system	0	Links & Inputs	\N	\N	\N	\N	t	theme.link.hover.color	Link Hover Color	\N	Theme Settings	COLOR	\N	#1565c0
5dbdea96-0a86-4e1b-a9aa-a1c3239385f1	2026-01-11 17:59:58.321048	system	t	2026-01-11 17:59:58.321048	system	0	Links & Inputs	\N	\N	\N	\N	t	theme.input.bg	Input Background	\N	Theme Settings	COLOR	\N	#ffffff
1fe20a66-304b-493a-882c-c0ddf928d2d5	2026-01-11 17:59:58.32505	system	t	2026-01-11 17:59:58.32505	system	0	Links & Inputs	\N	\N	\N	\N	t	theme.input.border	Input Border Color	\N	Theme Settings	COLOR	\N	#bdbdbd
1e3d59c9-a328-4537-b070-bd624230fe1d	2026-01-11 17:59:58.327048	system	t	2026-01-11 17:59:58.327048	system	0	Links & Inputs	\N	\N	\N	\N	t	theme.input.focus.border	Input Focus Border	\N	Theme Settings	COLOR	\N	#1976d2
f1e437ad-c38e-4b2c-a2ac-73b4cf452831	2026-01-11 17:59:58.330053	system	t	2026-01-11 17:59:58.330053	system	0	Typography	\N	\N	\N	\N	t	theme.font.primary	Primary Font	\N	Theme Settings	STRING	\N	Roboto, sans-serif
99283151-cd15-4253-92ed-aa9dbd206ef5	2026-01-11 17:59:58.332053	system	t	2026-01-11 17:59:58.332053	system	0	Typography	\N	\N	\N	\N	t	theme.font.size.base	Base Font Size (px)	\N	Theme Settings	NUMBER	\N	14
b82a57c3-0a7b-49b6-990b-cef72b0ef59a	2026-01-11 17:59:58.334055	system	t	2026-01-11 17:59:58.334055	system	0	Typography	\N	\N	\N	\N	t	theme.dark.mode	Dark Mode Enabled	\N	Theme Settings	BOOLEAN	\N	false
c9f136f1-5e7c-47c3-a638-ac45bfb8e6b3	2026-01-11 17:59:58.336053	system	t	2026-01-11 17:59:58.336053	system	0	Form Fields	\N	\N	\N	\N	t	theme.form.field.header.bg	Form Field Header Background	\N	Theme Settings	COLOR	\N	#1976d2
8762c385-a94e-41c3-80d6-023c7232e99b	2026-01-11 17:59:58.339054	system	t	2026-01-11 17:59:58.339054	system	0	Form Fields	\N	\N	\N	\N	t	theme.form.field.header.color	Form Field Header Color	\N	Theme Settings	COLOR	\N	#ffffff
5d813351-1e23-484a-99ed-b72bc2e4ed1c	2026-01-11 17:59:58.342053	system	t	2026-01-11 17:59:58.342053	system	0	Function Categories	\N	\N	\N	\N	t	theme.function.category.bg	Functions Category Collapsible Background	\N	Theme Settings	COLOR	\N	#f5f5f5
8c69256c-debd-4387-95eb-b4ea9ff80e46	2026-01-11 17:59:58.345386	system	t	2026-01-11 17:59:58.345386	system	0	Function Categories	\N	\N	\N	\N	t	theme.function.category.color	Functions Category Collapsible Color	\N	Theme Settings	COLOR	\N	#1e90ff
f2f5f676-494e-4342-80be-c7628acf3a3b	2026-01-11 17:59:58.347384	system	t	2026-01-11 17:59:58.347384	system	0	Function Categories	\N	\N	\N	\N	t	theme.function.font.size	Functions Font Size	\N	Theme Settings	NUMBER	\N	11
c7188f5f-16fc-4077-a083-7649dd38294a	2026-01-11 17:59:58.350386	system	t	2026-01-11 17:59:58.350386	system	0	Backup	\N	\N	\N	\N	t	backup.location	Backup Location	\N	General	STRING	\N	C:/Sonar Docs/backups/
f2c8c5cf-c240-425a-8422-042aa3daa0c7	2026-01-11 17:59:58.352386	system	t	2026-01-11 17:59:58.352386	system	0	Backup	\N	\N	\N	\N	t	backup.filename	Backup Filename Prefix	\N	General	STRING	\N	workflow_backup
11102bae-b369-4e12-92e8-909e209125b9	2026-01-11 17:59:58.354386	system	t	2026-01-11 17:59:58.354386	system	0	Workflow	\N	\N	\N	\N	t	workflow.require.approvers	Require At Least One Approver	\N	Workflow Settings	BOOLEAN	\N	true
9d372127-f616-4844-9a75-d2c59358f33b	2026-01-11 17:59:58.356385	system	t	2026-01-11 17:59:58.356385	system	0	Workflow	\N	\N	\N	\N	t	workflow.comments.mandatory	Comments Mandatory on Approval	\N	Workflow Settings	BOOLEAN	\N	false
6aad9406-3d0d-44a1-a771-a2629b9d195d	2026-01-11 17:59:58.358386	system	t	2026-01-11 17:59:58.358386	system	0	Workflow	\N	\N	\N	\N	t	workflow.comments.mandatory.reject	Comments Mandatory on Rejection	\N	Workflow Settings	BOOLEAN	\N	true
8b0944a3-af9a-4a66-bbfe-d2597add2bea	2026-01-11 17:59:58.360385	system	t	2026-01-11 17:59:58.360385	system	0	Workflow	\N	\N	\N	\N	t	workflow.comments.mandatory.escalate	Comments Mandatory on Escalation	\N	Workflow Settings	BOOLEAN	\N	true
249aa5c6-f61c-4bb8-a145-dc93109180ae	2026-01-11 17:59:58.362384	system	t	2026-01-11 17:59:58.362384	system	0	Financial Workflows	\N	\N	\N	\N	t	workflow.skip.unauthorized.approvers	Skip Unauthorized Approvers	\N	Workflow Settings	BOOLEAN	\N	true
07f4bffa-11ad-4113-92ac-83ab8afc9f32	2026-01-11 17:59:58.365386	system	t	2026-01-11 17:59:58.365386	system	0	Email Approvals	\N	\N	\N	\N	t	workflow.allow.email.approvals	Allow Approvals From Email	\N	Workflow Settings	BOOLEAN	\N	true
e6f9f61b-bc64-4083-b3c4-7742914fcd77	2026-01-11 17:59:58.367385	system	t	2026-01-11 17:59:58.367385	system	0	Display	\N	\N	\N	\N	t	reporting.font.size	Reporting Font Size (px)	\N	Reporting	NUMBER	\N	14
63dea421-f519-465e-8332-38ffa2970d49	2026-01-11 17:59:58.368385	system	t	2026-01-11 17:59:58.368385	system	0	Access Control	\N	\N	\N	\N	t	reporting.roles	Report Roles (comma-separated role names)	\N	Reporting	STRING	\N	
\.


--
-- Data for Name: system_state; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.system_state (id, created_at, created_by, is_active, updated_at, updated_by, version, is_locked, lock_reason, locked_at, locked_by, maintenance_message, maintenance_mode) FROM stdin;
417f4a58-ae02-4c5c-9cca-c0ab9ecabb69	2026-01-11 17:59:58.376385	system	t	2026-01-11 17:59:58.376385	system	0	f	\N	\N	\N	\N	f
\.


--
-- Data for Name: user_branches; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.user_branches (user_id, branch_id) FROM stdin;
\.


--
-- Data for Name: user_corporates; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.user_corporates (user_id, corporate_id) FROM stdin;
\.


--
-- Data for Name: user_departments; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.user_departments (user_id, department_id) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.user_roles (user_id, role_id) FROM stdin;
47723317-4570-47a1-b7a8-424d0ba58826	85a67ca5-ef7f-4163-abe3-deae1d970c0a
db561f25-5667-42cd-8b3d-688128e6be53	85a67ca5-ef7f-4163-abe3-deae1d970c0a
\.


--
-- Data for Name: user_sbus; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.user_sbus (user_id, sbu_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.users (id, created_at, created_by, is_active, updated_at, updated_by, version, department, email, failed_login_attempts, first_name, is_locked, last_login, last_name, lock_reason, locked_at, locked_by, must_change_password, password, password_changed_at, password_reset_token, password_reset_token_expiry, phone_number, profile_picture, staff_id, user_type, username) FROM stdin;
47723317-4570-47a1-b7a8-424d0ba58826	2026-01-11 17:59:58.083033	system	t	2026-01-11 17:59:58.083033	system	0	\N	admin@sonarworks.com	\N	System	f	\N	Administrator	\N	\N	\N	f	$2a$10$i2ZcFsURsf..tGfC93u1Aev.Abdo5xtRZWGRgCnfDxPhD33VBtlQi	\N	\N	\N	\N	\N	\N	SYSTEM	admin
db561f25-5667-42cd-8b3d-688128e6be53	2026-01-11 17:59:58.142648	system	t	2026-01-11 17:59:58.142648	system	0	\N	super@sonarworks.com	\N	Super	f	\N	User	\N	\N	\N	f	$2a$10$/GCoAPPGbTpjTTRhd01rRuJduHgr89dfcGt1EVecFmgTe1YiNQmOS	\N	\N	\N	\N	\N	\N	SYSTEM	super
\.


--
-- Data for Name: workflow_approvers; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_approvers (id, created_at, created_by, is_active, updated_at, updated_by, version, approval_limit, approver_email, approver_name, can_escalate, display_order, escalation_timeout_hours, is_unlimited, level, notify_on_approval, notify_on_pending, notify_on_rejection, sbu_id, user_id, workflow_id) FROM stdin;
\.


--
-- Data for Name: workflow_branches; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_branches (workflow_id, branch_id) FROM stdin;
\.


--
-- Data for Name: workflow_corporates; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_corporates (workflow_id, corporate_id) FROM stdin;
\.


--
-- Data for Name: workflow_departments; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_departments (workflow_id, department_id) FROM stdin;
\.


--
-- Data for Name: workflow_field_values; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_field_values (id, created_at, created_by, is_active, updated_at, updated_by, version, display_value, field_label, field_name, old_value, field_value, field_id, workflow_instance_id) FROM stdin;
\.


--
-- Data for Name: workflow_fields; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_fields (id, created_at, created_by, is_active, updated_at, updated_by, version, allowed_file_types, column_span, css_class, custom_validation_message, custom_validation_rule, data_type, default_value, display_order, dropdown_display_field, dropdown_source, dropdown_value_field, field_type, in_summary, is_attachment, is_hidden, is_limited, is_mandatory, is_readonly, is_searchable, is_title, is_unique, label, max_file_size, max_files, max_length, max_value, min_length, min_value, name, placeholder, tooltip, validation, validation_message, validation_regex, width, field_group_id, form_id) FROM stdin;
\.


--
-- Data for Name: workflow_forms; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_forms (id, created_at, created_by, is_active, updated_at, updated_by, version, description, display_order, icon, is_main_form, name, workflow_id) FROM stdin;
d89a6d5f-fca4-4a31-bd4f-ed6d3fe12ba9	2026-01-11 17:59:58.468777	system	t	2026-01-11 17:59:58.468777	system	0	\N	0	\N	t	Main Form	7af10231-568d-4b30-be61-8194fca1c741
faf0f43b-1808-40c6-91f2-0acc06cc7e8e	2026-01-11 17:59:58.480783	system	t	2026-01-11 17:59:58.480783	system	0	\N	0	\N	t	Main Form	95c1474b-038b-4ddc-9710-ca3439a63168
3ff869d5-69e0-49e5-9621-3da240c769c4	2026-01-11 17:59:58.487777	system	t	2026-01-11 17:59:58.487777	system	0	\N	0	\N	t	Main Form	8f5483e9-3300-427c-9c17-cb8f4feb4b58
3d1679de-9e92-4e14-b6f0-d8f6480bdd80	2026-01-11 17:59:58.497783	system	t	2026-01-11 17:59:58.497783	system	0	\N	0	\N	t	Main Form	2f5af517-2c22-4f50-9688-96607f4261c5
\.


--
-- Data for Name: workflow_instances; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_instances (id, created_at, created_by, is_active, updated_at, updated_by, version, amount, completed_at, current_approver_order, current_level, reference_number, status, submitted_at, summary, title, current_approver_id, initiator_id, sbu_id, workflow_id) FROM stdin;
\.


--
-- Data for Name: workflow_sbus; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_sbus (workflow_id, sbu_id) FROM stdin;
\.


--
-- Data for Name: workflow_types; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflow_types (id, created_at, created_by, is_active, updated_at, updated_by, version, code, color, description, display_order, icon, name) FROM stdin;
2a0a8c9c-4b93-4ec7-9bc5-2a03b90cdd73	2026-01-11 17:59:58.424385	system	t	2026-01-11 17:59:58.424385	system	0	APPROVAL	#4CAF50	General approval workflows	1	approval	Approval
15f4a629-d05a-4af1-b79e-2d4428ebab14	2026-01-11 17:59:58.428392	system	t	2026-01-11 17:59:58.428392	system	0	REQUISITION	#2196F3	Purchase and supply requisitions	2	shopping_cart	Requisition
18fa4939-fb56-4a19-afe5-65086a366511	2026-01-11 17:59:58.43139	system	t	2026-01-11 17:59:58.43139	system	0	LEAVE	#FF9800	Employee leave and time-off requests	3	event_busy	Leave Request
48c01680-7260-4e70-a623-cf84ec940124	2026-01-11 17:59:58.43339	system	t	2026-01-11 17:59:58.43339	system	0	EXPENSE	#9C27B0	Expense reimbursement workflows	4	receipt	Expense Claim
7370329d-9ce3-4c2d-acb2-b90944fe5841	2026-01-11 17:59:58.436391	system	t	2026-01-11 17:59:58.436391	system	0	TRAVEL	#00BCD4	Business travel approval workflows	5	flight	Travel Request
62a524bc-9d18-4e21-955f-e20a2c43b8cd	2026-01-11 17:59:58.43839	system	t	2026-01-11 17:59:58.43839	system	0	HR	#E91E63	Human resources related workflows	6	people	HR Process
6088a678-e42c-446c-a3a1-8b97c7c85550	2026-01-11 17:59:58.440392	system	t	2026-01-11 17:59:58.440392	system	0	FINANCE	#607D8B	Financial approval workflows	7	account_balance	Finance
c23106ac-56ce-4bf9-b045-142171bc1e69	2026-01-11 17:59:58.442903	system	t	2026-01-11 17:59:58.442903	system	0	IT	#795548	IT support and service requests	8	computer	IT Request
e618bd16-9bac-4ac5-b900-747d592f9c69	2026-01-11 17:59:58.444904	system	t	2026-01-11 17:59:58.444904	system	0	CUSTOM	#9E9E9E	Custom workflow type	99	settings	Custom
\.


--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: sonar
--

COPY public.workflows (id, created_at, created_by, is_active, updated_at, updated_by, version, code, comments_mandatory, comments_mandatory_on_escalate, comments_mandatory_on_reject, description, display_order, icon, is_published, name, requires_approval, version_number, workflow_category, workflow_type_id) FROM stdin;
7af10231-568d-4b30-be61-8194fca1c741	2026-01-11 17:59:58.453903	system	t	2026-01-11 17:59:58.453903	system	0	LEAVE_REQUEST	f	t	t	Submit leave requests for approval	1	event_busy	t	Leave Request	t	1	\N	18fa4939-fb56-4a19-afe5-65086a366511
95c1474b-038b-4ddc-9710-ca3439a63168	2026-01-11 17:59:58.480783	system	t	2026-01-11 17:59:58.480783	system	0	EXPENSE_CLAIM	f	t	t	Submit expense claims for reimbursement	2	receipt	t	Expense Claim	t	1	\N	48c01680-7260-4e70-a623-cf84ec940124
8f5483e9-3300-427c-9c17-cb8f4feb4b58	2026-01-11 17:59:58.485782	system	t	2026-01-11 17:59:58.485782	system	0	PURCHASE_REQ	f	t	t	Request approval for purchases	3	shopping_cart	t	Purchase Requisition	t	1	\N	15f4a629-d05a-4af1-b79e-2d4428ebab14
2f5af517-2c22-4f50-9688-96607f4261c5	2026-01-11 17:59:58.496786	system	t	2026-01-11 17:59:58.496786	system	0	TRAVEL_REQUEST	f	t	t	Submit travel requests for approval	4	flight	t	Travel Request	t	1	\N	7370329d-9ce3-4c2d-acb2-b90944fe5841
\.


--
-- Name: email_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sonar
--

SELECT pg_catalog.setval('public.email_settings_id_seq', 1, false);


--
-- Name: approval_history approval_history_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: corporates corporates_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.corporates
    ADD CONSTRAINT corporates_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: email_approval_tokens email_approval_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.email_approval_tokens
    ADD CONSTRAINT email_approval_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);


--
-- Name: field_groups field_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.field_groups
    ADD CONSTRAINT field_groups_pkey PRIMARY KEY (id);


--
-- Name: field_options field_options_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.field_options
    ADD CONSTRAINT field_options_pkey PRIMARY KEY (id);


--
-- Name: privileges privileges_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.privileges
    ADD CONSTRAINT privileges_pkey PRIMARY KEY (id);


--
-- Name: role_privileges role_privileges_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.role_privileges
    ADD CONSTRAINT role_privileges_pkey PRIMARY KEY (role_id, privilege_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sbus sbus_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.sbus
    ADD CONSTRAINT sbus_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: system_state system_state_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.system_state
    ADD CONSTRAINT system_state_pkey PRIMARY KEY (id);


--
-- Name: workflows uk2hiidryxa5rfu5giewi4o7kqk; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT uk2hiidryxa5rfu5giewi4o7kqk UNIQUE (name);


--
-- Name: sbus uk5snihnjh2ckw54x119tdso2rm; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.sbus
    ADD CONSTRAINT uk5snihnjh2ckw54x119tdso2rm UNIQUE (code);


--
-- Name: workflow_types uk99h1qx8a4g14881smrr7c2ody; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_types
    ADD CONSTRAINT uk99h1qx8a4g14881smrr7c2ody UNIQUE (code);


--
-- Name: workflow_types ukaqu4b2k1jjg1wi0fc0512kfge; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_types
    ADD CONSTRAINT ukaqu4b2k1jjg1wi0fc0512kfge UNIQUE (name);


--
-- Name: workflow_instances ukdqv1gj5na2jfqjgegulgnjt48; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT ukdqv1gj5na2jfqjgegulgnjt48 UNIQUE (reference_number);


--
-- Name: email_approval_tokens ukhmd09fdkksjb5r7j14lsk9hff; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.email_approval_tokens
    ADD CONSTRAINT ukhmd09fdkksjb5r7j14lsk9hff UNIQUE (token);


--
-- Name: categories ukiwylx6fb2dqdw8kfc31vaiiyp; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT ukiwylx6fb2dqdw8kfc31vaiiyp UNIQUE (code);


--
-- Name: corporates ukk02g9rx71rtv4eklsi2mae7a2; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.corporates
    ADD CONSTRAINT ukk02g9rx71rtv4eklsi2mae7a2 UNIQUE (code);


--
-- Name: departments ukl7tivi5261wxdnvo6cct9gg6t; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT ukl7tivi5261wxdnvo6cct9gg6t UNIQUE (code);


--
-- Name: privileges ukm2tnonbcaquofx1ccy060ejyc; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.privileges
    ADD CONSTRAINT ukm2tnonbcaquofx1ccy060ejyc UNIQUE (name);


--
-- Name: roles ukofx66keruapi6vyqpv6f2or37; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT ukofx66keruapi6vyqpv6f2or37 UNIQUE (name);


--
-- Name: users ukr43af9ap4edm43mmtq01oddj6; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT ukr43af9ap4edm43mmtq01oddj6 UNIQUE (username);


--
-- Name: branches ukrt29b5cpquhexus5t5ywalg67; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT ukrt29b5cpquhexus5t5ywalg67 UNIQUE (code);


--
-- Name: settings ukswd05dvj4ukvw5q135bpbbfae; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT ukswd05dvj4ukvw5q135bpbbfae UNIQUE (setting_key);


--
-- Name: workflows ukt9up8ia4sq6lnm259p1vj0d7i; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT ukt9up8ia4sq6lnm259p1vj0d7i UNIQUE (code);


--
-- Name: user_branches user_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_branches
    ADD CONSTRAINT user_branches_pkey PRIMARY KEY (user_id, branch_id);


--
-- Name: user_corporates user_corporates_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_corporates
    ADD CONSTRAINT user_corporates_pkey PRIMARY KEY (user_id, corporate_id);


--
-- Name: user_departments user_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_pkey PRIMARY KEY (user_id, department_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_sbus user_sbus_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_sbus
    ADD CONSTRAINT user_sbus_pkey PRIMARY KEY (user_id, sbu_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workflow_approvers workflow_approvers_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_approvers
    ADD CONSTRAINT workflow_approvers_pkey PRIMARY KEY (id);


--
-- Name: workflow_branches workflow_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_branches
    ADD CONSTRAINT workflow_branches_pkey PRIMARY KEY (workflow_id, branch_id);


--
-- Name: workflow_corporates workflow_corporates_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_corporates
    ADD CONSTRAINT workflow_corporates_pkey PRIMARY KEY (workflow_id, corporate_id);


--
-- Name: workflow_departments workflow_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_departments
    ADD CONSTRAINT workflow_departments_pkey PRIMARY KEY (workflow_id, department_id);


--
-- Name: workflow_field_values workflow_field_values_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_field_values
    ADD CONSTRAINT workflow_field_values_pkey PRIMARY KEY (id);


--
-- Name: workflow_fields workflow_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_fields
    ADD CONSTRAINT workflow_fields_pkey PRIMARY KEY (id);


--
-- Name: workflow_forms workflow_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_forms
    ADD CONSTRAINT workflow_forms_pkey PRIMARY KEY (id);


--
-- Name: workflow_instances workflow_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_pkey PRIMARY KEY (id);


--
-- Name: workflow_sbus workflow_sbus_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_sbus
    ADD CONSTRAINT workflow_sbus_pkey PRIMARY KEY (workflow_id, sbu_id);


--
-- Name: workflow_types workflow_types_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_types
    ADD CONSTRAINT workflow_types_pkey PRIMARY KEY (id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: sbus fk1ek597f9jt3ej0t7p8cpgt8mh; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.sbus
    ADD CONSTRAINT fk1ek597f9jt3ej0t7p8cpgt8mh FOREIGN KEY (parent_id) REFERENCES public.sbus(id);


--
-- Name: departments fk226fh1wc7bylvqe18h9busf66; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk226fh1wc7bylvqe18h9busf66 FOREIGN KEY (corporate_id) REFERENCES public.corporates(id);


--
-- Name: field_options fk35rwbkkbvv8pecsbvcm6qfops; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.field_options
    ADD CONSTRAINT fk35rwbkkbvv8pecsbvcm6qfops FOREIGN KEY (field_id) REFERENCES public.workflow_fields(id);


--
-- Name: approval_history fk3gsp8w4dkklc166smvy9ft06; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT fk3gsp8w4dkklc166smvy9ft06 FOREIGN KEY (workflow_instance_id) REFERENCES public.workflow_instances(id);


--
-- Name: workflow_approvers fk4k8mgacoxgiepyhh3sg5ki1k4; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_approvers
    ADD CONSTRAINT fk4k8mgacoxgiepyhh3sg5ki1k4 FOREIGN KEY (sbu_id) REFERENCES public.sbus(id);


--
-- Name: workflow_instances fk60ld5qya2csil0e125m2d428b; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT fk60ld5qya2csil0e125m2d428b FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflow_approvers fk81n9qrx6xbw4t9eh9l2n34qy; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_approvers
    ADD CONSTRAINT fk81n9qrx6xbw4t9eh9l2n34qy FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: workflow_forms fk8alfxwm94mcsd1vuw2qy410v3; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_forms
    ADD CONSTRAINT fk8alfxwm94mcsd1vuw2qy410v3 FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflow_departments fk8mb214j3dgoqyw2hiysug1bir; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_departments
    ADD CONSTRAINT fk8mb214j3dgoqyw2hiysug1bir FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflow_field_values fk9eqss78olklp3w96csb7em975; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_field_values
    ADD CONSTRAINT fk9eqss78olklp3w96csb7em975 FOREIGN KEY (field_id) REFERENCES public.workflow_fields(id);


--
-- Name: workflow_field_values fkaijl4x47s6ypsikt8457dfmqf; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_field_values
    ADD CONSTRAINT fkaijl4x47s6ypsikt8457dfmqf FOREIGN KEY (workflow_instance_id) REFERENCES public.workflow_instances(id);


--
-- Name: role_privileges fkbosd0iqvr1efg44c01jcuvdxt; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.role_privileges
    ADD CONSTRAINT fkbosd0iqvr1efg44c01jcuvdxt FOREIGN KEY (privilege_id) REFERENCES public.privileges(id);


--
-- Name: workflow_instances fkbsborkipbtat4kyavd24fhi02; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT fkbsborkipbtat4kyavd24fhi02 FOREIGN KEY (current_approver_id) REFERENCES public.workflow_approvers(id);


--
-- Name: attachments fkbwy6vcwkf9h3dxdvig18eyglu; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT fkbwy6vcwkf9h3dxdvig18eyglu FOREIGN KEY (workflow_instance_id) REFERENCES public.workflow_instances(id);


--
-- Name: workflow_instances fkc165meo9uo4pwwcf40j0njgm2; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT fkc165meo9uo4pwwcf40j0njgm2 FOREIGN KEY (initiator_id) REFERENCES public.users(id);


--
-- Name: workflow_corporates fkcqw8owgs2mr210ekodbowms4; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_corporates
    ADD CONSTRAINT fkcqw8owgs2mr210ekodbowms4 FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflow_sbus fkd292455xdrvoaegbm7ofvgc7u; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_sbus
    ADD CONSTRAINT fkd292455xdrvoaegbm7ofvgc7u FOREIGN KEY (sbu_id) REFERENCES public.sbus(id);


--
-- Name: user_sbus fkd91yabrli3a4i2jdxnr1r215l; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_sbus
    ADD CONSTRAINT fkd91yabrli3a4i2jdxnr1r215l FOREIGN KEY (sbu_id) REFERENCES public.sbus(id);


--
-- Name: role_privileges fkddceebgln19s0c4tjwj01v1ou; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.role_privileges
    ADD CONSTRAINT fkddceebgln19s0c4tjwj01v1ou FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_departments fke1yilu7bslmau7ojj0n2pu812; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT fke1yilu7bslmau7ojj0n2pu812 FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: user_departments fkeklynfw1mm4x2289n61pj0ojn; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT fkeklynfw1mm4x2289n61pj0ojn FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs fkfk6x0vgw7woounwyh5f0j94kn; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fkfk6x0vgw7woounwyh5f0j94kn FOREIGN KEY (workflow_instance_id) REFERENCES public.workflow_instances(id);


--
-- Name: user_branches fkg2946lycn8eakmt5i6l0xaq53; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_branches
    ADD CONSTRAINT fkg2946lycn8eakmt5i6l0xaq53 FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: field_groups fkg2gu8xvadisinxi9svwqsbbu2; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.field_groups
    ADD CONSTRAINT fkg2gu8xvadisinxi9svwqsbbu2 FOREIGN KEY (form_id) REFERENCES public.workflow_forms(id);


--
-- Name: branches fkgimsbfhy3e29noqexqoslo72r; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT fkgimsbfhy3e29noqexqoslo72r FOREIGN KEY (sbu_id) REFERENCES public.sbus(id);


--
-- Name: workflow_branches fkgmg4mawapdw1bpnkals5yhpjg; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_branches
    ADD CONSTRAINT fkgmg4mawapdw1bpnkals5yhpjg FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: user_roles fkh8ciramu9cc9q3qcqiv4ue8a6; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fkh8ciramu9cc9q3qcqiv4ue8a6 FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_roles fkhfh9dx7w3ubf1co1vdev94g3f; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fkhfh9dx7w3ubf1co1vdev94g3f FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_corporates fkhivo30hyjv6nuq4sypo3hhhjs; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_corporates
    ADD CONSTRAINT fkhivo30hyjv6nuq4sypo3hhhjs FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: workflow_departments fkhqtvyntrciq8l1to18l4hxows; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_departments
    ADD CONSTRAINT fkhqtvyntrciq8l1to18l4hxows FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: audit_logs fkhrmsmm6mjl7wb5eib671isdyo; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fkhrmsmm6mjl7wb5eib671isdyo FOREIGN KEY (sbu_id) REFERENCES public.sbus(id);


--
-- Name: user_sbus fkioo6wse4379xmobeh1nm6eqm; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_sbus
    ADD CONSTRAINT fkioo6wse4379xmobeh1nm6eqm FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: workflow_sbus fkipf11xygga0cm96mr4oa9ymq5; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_sbus
    ADD CONSTRAINT fkipf11xygga0cm96mr4oa9ymq5 FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflow_fields fkj6osvgrmbe117lv7wybnbnt34; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_fields
    ADD CONSTRAINT fkj6osvgrmbe117lv7wybnbnt34 FOREIGN KEY (form_id) REFERENCES public.workflow_forms(id);


--
-- Name: corporates fkj70sfftb2fig1mrkfjrqrc7ql; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.corporates
    ADD CONSTRAINT fkj70sfftb2fig1mrkfjrqrc7ql FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: workflow_instances fkjfqhegpx6yqxlug2b7xty3skv; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT fkjfqhegpx6yqxlug2b7xty3skv FOREIGN KEY (sbu_id) REFERENCES public.sbus(id);


--
-- Name: sbus fklp7a80rk5lbv6amiyeariniim; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.sbus
    ADD CONSTRAINT fklp7a80rk5lbv6amiyeariniim FOREIGN KEY (corporate_id) REFERENCES public.corporates(id);


--
-- Name: workflows fklpu1c8ehopi2ftk0n3o5g7sgv; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT fklpu1c8ehopi2ftk0n3o5g7sgv FOREIGN KEY (workflow_type_id) REFERENCES public.workflow_types(id);


--
-- Name: workflow_corporates fkmqt6f60l1dhnut5u0cqnugwnn; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_corporates
    ADD CONSTRAINT fkmqt6f60l1dhnut5u0cqnugwnn FOREIGN KEY (corporate_id) REFERENCES public.corporates(id);


--
-- Name: workflow_approvers fkn6cc1qnb2oxs6clxbud3jumkj; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_approvers
    ADD CONSTRAINT fkn6cc1qnb2oxs6clxbud3jumkj FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflow_fields fkog7llpqwcoa0ejw058sht9pnp; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_fields
    ADD CONSTRAINT fkog7llpqwcoa0ejw058sht9pnp FOREIGN KEY (field_group_id) REFERENCES public.field_groups(id);


--
-- Name: email_approval_tokens fkq23yyyvrxxgu5uon9ivb8vlmc; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.email_approval_tokens
    ADD CONSTRAINT fkq23yyyvrxxgu5uon9ivb8vlmc FOREIGN KEY (workflow_instance_id) REFERENCES public.workflow_instances(id);


--
-- Name: workflow_branches fkrghvej46qkcbkk241n5nk16u3; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.workflow_branches
    ADD CONSTRAINT fkrghvej46qkcbkk241n5nk16u3 FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: approval_history fkseinmudit4pmpqg5sd6ux3gu; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT fkseinmudit4pmpqg5sd6ux3gu FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: user_corporates fksg548agy4cewk069as4rfkitw; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_corporates
    ADD CONSTRAINT fksg548agy4cewk069as4rfkitw FOREIGN KEY (corporate_id) REFERENCES public.corporates(id);


--
-- Name: user_branches fktdeftymo1mk999qigob1ji2p0; Type: FK CONSTRAINT; Schema: public; Owner: sonar
--

ALTER TABLE ONLY public.user_branches
    ADD CONSTRAINT fktdeftymo1mk999qigob1ji2p0 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict eIUgCOqKe2BRu6ZfB5thB2LeLV0HjU6U1iyrbz9Hfdp7kURAQwiPmw6hfc8f72G

