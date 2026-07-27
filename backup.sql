--
-- PostgreSQL database dump
--

\restrict WTD1NSwtAMxe2ySjZFlxMdlTuYlRdNjqWy3eCM8WM52dzG79sEnmyXJkoPsXpP5

-- Dumped from database version 17.10 (2947584)
-- Dumped by pg_dump version 17.10 (Homebrew)

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

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO neondb_owner;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: neon_auth
--

CREATE SCHEMA neon_auth;


ALTER SCHEMA neon_auth OWNER TO neon_auth;

--
-- Name: customer_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.customer_type AS ENUM (
    'fixed',
    'single'
);


ALTER TYPE public.customer_type OWNER TO neondb_owner;

--
-- Name: display_mode; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.display_mode AS ENUM (
    'by-article',
    'by-section'
);


ALTER TYPE public.display_mode OWNER TO neondb_owner;

--
-- Name: role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.role AS ENUM (
    'admin',
    'owner',
    'staff'
);


ALTER TYPE public.role OWNER TO neondb_owner;

--
-- Name: unit; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.unit AS ENUM (
    'pieces',
    'kg'
);


ALTER TYPE public.unit OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: neondb_owner
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: neondb_owner
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: neondb_owner
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.account OWNER TO neon_auth;

--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


ALTER TABLE neon_auth.invitation OWNER TO neon_auth;

--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);


ALTER TABLE neon_auth.jwks OWNER TO neon_auth;

--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.member OWNER TO neon_auth;

--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


ALTER TABLE neon_auth.organization OWNER TO neon_auth;

--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


ALTER TABLE neon_auth.project_config OWNER TO neon_auth;

--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


ALTER TABLE neon_auth.session OWNER TO neon_auth;

--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


ALTER TABLE neon_auth."user" OWNER TO neon_auth;

--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE neon_auth.verification OWNER TO neon_auth;

--
-- Name: bakeries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bakeries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    order_cutoff_hour integer
);


ALTER TABLE public.bakeries OWNER TO neondb_owner;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bakery_id uuid NOT NULL,
    name text NOT NULL,
    type public.customer_type DEFAULT 'single'::public.customer_type NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- Name: daily_item_status; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.daily_item_status (
    bakery_id uuid NOT NULL,
    date date NOT NULL,
    customer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    done boolean DEFAULT false NOT NULL,
    variant text
);


ALTER TABLE public.daily_item_status OWNER TO neondb_owner;

--
-- Name: daily_order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.daily_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    daily_order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit public.unit NOT NULL,
    done boolean DEFAULT false NOT NULL,
    variant text,
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.daily_order_items OWNER TO neondb_owner;

--
-- Name: daily_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.daily_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bakery_id uuid NOT NULL,
    date date NOT NULL,
    customer_id uuid NOT NULL
);


ALTER TABLE public.daily_orders OWNER TO neondb_owner;

--
-- Name: divisors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.divisors (
    bakery_id uuid NOT NULL,
    product_id uuid NOT NULL,
    value integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.divisors OWNER TO neondb_owner;

--
-- Name: production_group_sections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.production_group_sections (
    group_id uuid NOT NULL,
    section_id uuid NOT NULL
);


ALTER TABLE public.production_group_sections OWNER TO neondb_owner;

--
-- Name: production_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.production_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bakery_id uuid NOT NULL,
    name text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    display_mode public.display_mode DEFAULT 'by-article'::public.display_mode
);


ALTER TABLE public.production_groups OWNER TO neondb_owner;

--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bakery_id uuid NOT NULL,
    name text NOT NULL,
    section_id uuid NOT NULL,
    unit public.unit DEFAULT 'pieces'::public.unit NOT NULL,
    pieces_per_kg integer,
    additions_watch boolean DEFAULT false NOT NULL
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: recurring_order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.recurring_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recurring_order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit public.unit NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    weekday smallint,
    removed boolean DEFAULT false NOT NULL
);


ALTER TABLE public.recurring_order_items OWNER TO neondb_owner;

--
-- Name: recurring_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.recurring_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bakery_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    weekdays smallint[] DEFAULT '{}'::smallint[] NOT NULL
);


ALTER TABLE public.recurring_orders OWNER TO neondb_owner;

--
-- Name: role_permission_overrides; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permission_overrides (
    bakery_id uuid NOT NULL,
    role public.role NOT NULL,
    permission text NOT NULL,
    allowed boolean NOT NULL
);


ALTER TABLE public.role_permission_overrides OWNER TO neondb_owner;

--
-- Name: sections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bakery_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.sections OWNER TO neondb_owner;

--
-- Name: user_permission_overrides; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_permission_overrides (
    user_id uuid NOT NULL,
    permission text NOT NULL,
    allowed boolean NOT NULL
);


ALTER TABLE public.user_permission_overrides OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bakery_id uuid NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public.role DEFAULT 'staff'::public.role NOT NULL,
    name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: neondb_owner
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	168c450173f91dd0fd3acf27b6bf772c666552a49cfd70202baf4be291a9ffce	1779013229464
2	87a09bc2b612dce8a64a0d31d3368608cbd2135c4652ffb6da2af5ace45f3410	1780230395408
3	f0133c8492ba756c9f5849c461e403252b6d005709d582b748ad26a28df02422	1780747949047
4	4a46807a679aaf1733544d0045dd7fe964f0b2adb014b1ed1af07d56bd92b61c	1781126148729
\.


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
267d99a1-e645-4818-ac31-637a017a79e3	Dentella-Luca-PWA	ep-dark-tree-app2qlak	2026-05-17 10:21:15.939+00	2026-05-17 10:21:15.939+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"magicLink": {"config": {"expiresIn": 5, "disableSignUp": false}, "enabled": false}, "phoneNumber": {"config": {"otp_expires_in": 300}, "enabled": false}, "organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bakeries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bakeries (id, name, slug, created_at, order_cutoff_hour) FROM stdin;
c59cf1ca-1701-476e-8045-584ecac569e4	Dentella	dentella	2026-05-17 12:41:25.663565+00	7
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, bakery_id, name, type, active) FROM stdin;
0d15e08b-5e7f-4f56-bfe3-9c6fc4b759b8	c59cf1ca-1701-476e-8045-584ecac569e4	U2 L	fixed	t
5da77be1-5979-4b52-8458-0714e4c125ae	c59cf1ca-1701-476e-8045-584ecac569e4	Ricovero	fixed	t
4521485d-fabe-4642-ae7b-b0977a907778	c59cf1ca-1701-476e-8045-584ecac569e4	Ricovero s	fixed	t
394263e1-862e-4ba8-9f0f-c8111bfdad04	c59cf1ca-1701-476e-8045-584ecac569e4	Giovanni	fixed	t
a6acee58-86b7-4e3c-be37-1a027f81d472	c59cf1ca-1701-476e-8045-584ecac569e4	Giovanni s	fixed	t
8a3bce96-f4e0-4d17-918b-8bd0232a4ef8	c59cf1ca-1701-476e-8045-584ecac569e4	Gourmet	fixed	t
f5f646ac-139f-4236-b39d-ff7fb0ebd49c	c59cf1ca-1701-476e-8045-584ecac569e4	Crai S	fixed	t
fcdeefb8-4a01-48a1-8182-4e69846adb36	c59cf1ca-1701-476e-8045-584ecac569e4	Sella	fixed	t
6b4b4262-1803-4c1e-8ee2-18a6b232db44	c59cf1ca-1701-476e-8045-584ecac569e4	Mainetti	fixed	t
4c330f97-0072-4a8b-b838-dd5a80e04743	c59cf1ca-1701-476e-8045-584ecac569e4	Ely	fixed	t
d77beea8-aee1-496d-bf77-197fe5a7d33d	c59cf1ca-1701-476e-8045-584ecac569e4	Pianca	fixed	t
f18e8603-a1bf-480f-a04a-72e923f6f840	c59cf1ca-1701-476e-8045-584ecac569e4	Liberty S	fixed	t
6fbcd3bb-4cad-42b6-a48f-5b54a20f2162	c59cf1ca-1701-476e-8045-584ecac569e4	Luca	fixed	t
c0097363-6934-44ce-bcb9-3326398f03d5	c59cf1ca-1701-476e-8045-584ecac569e4	Mirella	fixed	t
5392609a-b64e-4ace-9165-decba56dd007	c59cf1ca-1701-476e-8045-584ecac569e4	U2	fixed	t
8813879e-e196-4ac4-b789-6604191de723	c59cf1ca-1701-476e-8045-584ecac569e4	Samanta	fixed	t
0ca9feb0-22dd-4639-a9e6-250698fad811	c59cf1ca-1701-476e-8045-584ecac569e4	Cassero	fixed	t
9793e3a6-71ed-4214-a2a4-d6c63949460f	c59cf1ca-1701-476e-8045-584ecac569e4	Cassero L	fixed	t
5895aff1-7b2c-4cd6-91fd-03784949555d	c59cf1ca-1701-476e-8045-584ecac569e4	Cassero S	fixed	t
f0ae8f60-6c0b-456d-b4bc-3c2d6e8243c9	c59cf1ca-1701-476e-8045-584ecac569e4	Food	fixed	t
4c7fc769-9886-4922-a1c4-4088e6129a1f	c59cf1ca-1701-476e-8045-584ecac569e4	Crai	fixed	t
d3d03a88-b990-4f2a-89b3-44129b6e1a8d	c59cf1ca-1701-476e-8045-584ecac569e4	Lorenzo	fixed	t
ca613f17-e271-4112-b8a7-4ad570cb883e	c59cf1ca-1701-476e-8045-584ecac569e4	Cosimo	fixed	t
940fe04c-9492-4338-92ae-f5a8523564f6	c59cf1ca-1701-476e-8045-584ecac569e4	Cosimo S	fixed	t
3b023775-f555-424b-afbb-621523bfc6c4	c59cf1ca-1701-476e-8045-584ecac569e4	Patrizia	fixed	t
a673fbc3-6270-4dc1-bb16-eec8e75aa3bc	c59cf1ca-1701-476e-8045-584ecac569e4	Plello	fixed	t
11d5a819-8cb2-4e7f-8ca4-ab74e03f4d48	c59cf1ca-1701-476e-8045-584ecac569e4	Silvano	fixed	t
3e08f094-ea18-4805-aeb8-3385acb35d5d	c59cf1ca-1701-476e-8045-584ecac569e4	Spritz	fixed	t
288393fb-b6de-47e2-af27-9a01b5f0e48b	c59cf1ca-1701-476e-8045-584ecac569e4	Era	fixed	t
81c8e48f-be6f-42d2-994c-d9a02d08c852	c59cf1ca-1701-476e-8045-584ecac569e4	Ely S	fixed	t
eaaebe76-c3f5-440a-8962-a9928dd229a3	c59cf1ca-1701-476e-8045-584ecac569e4	Fonte S	fixed	t
633dddf7-5b9f-41ec-bbba-6bf17153efd1	c59cf1ca-1701-476e-8045-584ecac569e4	Liberty	fixed	t
2f5b6619-208f-4b16-80d6-4aba66a2c354	c59cf1ca-1701-476e-8045-584ecac569e4	Fonte	fixed	t
62048060-cd8f-4d05-a079-935b498a603d	c59cf1ca-1701-476e-8045-584ecac569e4	Cavallirio	fixed	t
04063944-3993-49f1-9a3c-78c7b28317f0	c59cf1ca-1701-476e-8045-584ecac569e4	Andrea	fixed	t
e8108da7-47ac-4a37-aa97-a735e0caf5ae	c59cf1ca-1701-476e-8045-584ecac569e4	Conad Borgo	fixed	t
894cbadb-9274-4cb7-811c-6ea7beb9e547	c59cf1ca-1701-476e-8045-584ecac569e4	Conad Borgo L	fixed	t
b99c6dcb-bd98-48f7-a694-a825ce74cce7	c59cf1ca-1701-476e-8045-584ecac569e4	Corrado S	fixed	t
6f486bb1-d469-488d-a000-936fd09668e0	c59cf1ca-1701-476e-8045-584ecac569e4	Corrado L	fixed	t
577785d6-7777-4a19-b3c0-3eab2dae76d2	c59cf1ca-1701-476e-8045-584ecac569e4	Cristina S	fixed	t
6b8f8d83-4a4d-41ad-92e4-a16a09e090ca	c59cf1ca-1701-476e-8045-584ecac569e4	Gasparetto	fixed	t
4971bc8e-a7f2-426d-a02a-5bde6ecd5aff	c59cf1ca-1701-476e-8045-584ecac569e4	Fico	fixed	t
07cc24cc-d0c0-442c-aeec-11afc6f0374d	c59cf1ca-1701-476e-8045-584ecac569e4	Fico L	fixed	t
daca63ba-fd3b-433f-b304-a72989bc4192	c59cf1ca-1701-476e-8045-584ecac569e4	Pasquale	fixed	t
3edade55-dc29-41ca-96b4-e8112b690417	c59cf1ca-1701-476e-8045-584ecac569e4	Pasquale L	fixed	t
2588c605-43fd-4bd9-960f-b5e531cd500c	c59cf1ca-1701-476e-8045-584ecac569e4	Orta	fixed	t
cdf1089c-ffcd-4e68-b7e2-076e7fdf56ba	c59cf1ca-1701-476e-8045-584ecac569e4	Edera	fixed	t
99b425f3-fc3e-42bf-8d95-b0b1b4aeac96	c59cf1ca-1701-476e-8045-584ecac569e4	Locanda	fixed	t
b5f04919-6ead-4cc1-b4c1-fc9eb86a2d5f	c59cf1ca-1701-476e-8045-584ecac569e4	Nervi	fixed	t
9bc2f9da-5cba-45f5-9c3f-540736c11e12	c59cf1ca-1701-476e-8045-584ecac569e4	Cristina	fixed	t
4936666b-0307-4246-8fa0-81f928b7e488	c59cf1ca-1701-476e-8045-584ecac569e4	Asilo	fixed	t
a03ad5a4-adbd-4a6f-a6f4-9f5f7e095a44	c59cf1ca-1701-476e-8045-584ecac569e4	Pasquale S	fixed	t
5741d63c-03e6-4bcf-8997-04fa15d2ce54	c59cf1ca-1701-476e-8045-584ecac569e4	Era S	fixed	t
62b75f77-6757-4880-b901-b51de3f65461	c59cf1ca-1701-476e-8045-584ecac569e4	H2No	fixed	t
0aedcd37-9e79-4814-af35-f84cd086ae35	c59cf1ca-1701-476e-8045-584ecac569e4	H2No S	fixed	t
f5a9c339-fa39-41b5-8bc9-66370b718611	c59cf1ca-1701-476e-8045-584ecac569e4	Rachele	fixed	t
86c53372-e266-45b1-8b00-b012abb7acb2	c59cf1ca-1701-476e-8045-584ecac569e4	Rachele S	fixed	t
8da24ed2-caf4-4b0f-bb96-964c4885ec6e	c59cf1ca-1701-476e-8045-584ecac569e4	Conad Borgo S	fixed	t
a3595dbc-3d22-45d5-8bc3-440a2a7e4f25	c59cf1ca-1701-476e-8045-584ecac569e4	Darbia	fixed	t
74be11ea-ca84-4488-89ca-f6e0d2fab8ce	c59cf1ca-1701-476e-8045-584ecac569e4	Andrea S	fixed	t
b02cc935-ac79-4eba-ad33-bd16bc281a76	c59cf1ca-1701-476e-8045-584ecac569e4	Deborah S	fixed	t
0b2fc911-df7e-4bd0-b309-8cb13a702bd1	c59cf1ca-1701-476e-8045-584ecac569e4	Bettole	fixed	t
c404a6df-578e-444b-a29a-c3e0d3e8d6b5	c59cf1ca-1701-476e-8045-584ecac569e4	Piccolo caffè	fixed	t
dda07f05-6821-4216-ac71-f3baad9927e4	c59cf1ca-1701-476e-8045-584ecac569e4	Piccolo caffè S	fixed	t
a44a2534-7461-4ae6-aefd-f35b71b0786b	c59cf1ca-1701-476e-8045-584ecac569e4	Marta S	fixed	t
ae232ce5-658d-4f5e-9f20-5ae4c7fa3e32	c59cf1ca-1701-476e-8045-584ecac569e4	Daniele	fixed	t
0f7879c9-bdef-4c8c-84e7-6395f1c2a480	c59cf1ca-1701-476e-8045-584ecac569e4	Spritz S	fixed	t
e0e7778a-f8f6-407e-8f4a-424e6ade02d1	c59cf1ca-1701-476e-8045-584ecac569e4	Crai L	fixed	t
34aa3d9f-024c-4adc-a90b-f13a5539b8b2	c59cf1ca-1701-476e-8045-584ecac569e4	Stuzzicami	fixed	t
bc3bf050-3d02-4f1e-9cfb-2e05cd36ac92	c59cf1ca-1701-476e-8045-584ecac569e4	Mio S	fixed	t
0dab90bf-6bc0-41e0-96cc-74d26e6d603d	c59cf1ca-1701-476e-8045-584ecac569e4	Varallo L	fixed	t
da66e9ec-6209-4924-beee-ad3d2c3caedb	c59cf1ca-1701-476e-8045-584ecac569e4	Darbia S	fixed	t
4d6bc915-5d6b-448c-9ed2-b6ac83108f81	c59cf1ca-1701-476e-8045-584ecac569e4	Andrea L	fixed	t
b3ce2c2f-8a8f-4358-ab15-24c153e81642	c59cf1ca-1701-476e-8045-584ecac569e4	Serena	fixed	t
00cfe484-775a-42c9-8ead-3f502f0da9c0	c59cf1ca-1701-476e-8045-584ecac569e4	Gasparetto S	fixed	t
92cf4e50-4cf6-4be8-9c46-33fc4790a037	c59cf1ca-1701-476e-8045-584ecac569e4	Lola	fixed	t
ab8f3b56-800f-4ff5-82e9-f3aa8de4b16b	c59cf1ca-1701-476e-8045-584ecac569e4	Tiziana S	fixed	t
62313297-8537-4d25-b885-82d3b48fed81	c59cf1ca-1701-476e-8045-584ecac569e4	Caseificio S	fixed	t
19bfe055-0567-4aac-80d8-c2487cbe7ef2	c59cf1ca-1701-476e-8045-584ecac569e4	Mercatino	fixed	t
ef32c73b-fa81-4232-aa36-e90492bac3fe	c59cf1ca-1701-476e-8045-584ecac569e4	Mercatino S	fixed	t
a0d7c395-0588-4c05-9b97-e701f8025c19	c59cf1ca-1701-476e-8045-584ecac569e4	Raquel S	fixed	t
5925749c-d692-4db6-b2df-776288712341	c59cf1ca-1701-476e-8045-584ecac569e4	Fobello S	fixed	t
4a6ff664-55d9-4f9f-997c-38159e1263d6	c59cf1ca-1701-476e-8045-584ecac569e4	Gourmet S	fixed	t
4995f937-9646-4a2e-8a7f-a3f68d270a4c	c59cf1ca-1701-476e-8045-584ecac569e4	Cervatto S	fixed	t
fd619afc-d15f-41d9-a038-ea5687c32e44	c59cf1ca-1701-476e-8045-584ecac569e4	Arnaldo	fixed	t
1dea546c-e534-45d6-8668-1bc86717393d	c59cf1ca-1701-476e-8045-584ecac569e4	Vincenzo	fixed	t
9e848de4-ef6a-4c46-9cda-b51fa0317538	c59cf1ca-1701-476e-8045-584ecac569e4	Casellino	fixed	t
de447924-c905-4bc6-8183-0400e6801f38	c59cf1ca-1701-476e-8045-584ecac569e4	Sacchi S	fixed	t
21d59b57-1639-4b62-8639-5313e246bf7f	c59cf1ca-1701-476e-8045-584ecac569e4	Sacchi	fixed	t
d49987bc-173a-417f-b9ef-da73548ed937	c59cf1ca-1701-476e-8045-584ecac569e4	Tiziana	fixed	t
f48b54f1-3b16-495d-a934-abaca0dd5b47	c59cf1ca-1701-476e-8045-584ecac569e4	Ornella L	fixed	t
2ee3ec45-4b67-4d05-a5ce-1a023edbb101	c59cf1ca-1701-476e-8045-584ecac569e4	Deborah L	fixed	t
fb04fe78-9d1e-4a9b-80ba-508735c81f51	c59cf1ca-1701-476e-8045-584ecac569e4	Tiziana L	fixed	t
22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	c59cf1ca-1701-476e-8045-584ecac569e4	Varallo	fixed	t
6c7a870b-b025-4bc2-8b6d-c02b0f87fc00	c59cf1ca-1701-476e-8045-584ecac569e4	Varallo S	fixed	t
2532fb82-150a-425a-880c-b9f56067c60d	c59cf1ca-1701-476e-8045-584ecac569e4	Deborah	fixed	t
079bc3e5-9ced-4d8e-b161-aa9873237eec	c59cf1ca-1701-476e-8045-584ecac569e4	Raquel	fixed	t
8cc9ab0a-cc49-449b-a61b-528919a9e715	c59cf1ca-1701-476e-8045-584ecac569e4	Ornella	fixed	t
143c8cd8-7184-4a77-90ab-1072f0fafa68	c59cf1ca-1701-476e-8045-584ecac569e4	Mainetti S	fixed	t
c841f876-6398-48d7-80ff-e15a49dd6468	c59cf1ca-1701-476e-8045-584ecac569e4	Lora	fixed	t
401640c2-5c26-41a4-a497-8f8ef3260fc4	c59cf1ca-1701-476e-8045-584ecac569e4	Corrado	fixed	t
ce008209-a756-42cc-9e1f-2474d021bc24	c59cf1ca-1701-476e-8045-584ecac569e4	Ely L	fixed	t
c3a1d2b8-df74-476e-a583-7b417af23d47	c59cf1ca-1701-476e-8045-584ecac569e4	Caseificio	fixed	t
2210a675-49eb-4b1a-9bfa-dede036e1c5d	c59cf1ca-1701-476e-8045-584ecac569e4	Trimarchi	fixed	t
30ad80a0-fccd-482c-9757-cf0405e165d0	c59cf1ca-1701-476e-8045-584ecac569e4	Bettole L	fixed	t
785b3a85-0fb8-491c-b803-bdc4916d2655	c59cf1ca-1701-476e-8045-584ecac569e4	Bettole S	fixed	t
d4f24e04-8a5d-49a1-b598-52fdbe0a60ba	c59cf1ca-1701-476e-8045-584ecac569e4	Ornella S	fixed	t
529a7318-222b-4095-9202-a51d5d1bc492	c59cf1ca-1701-476e-8045-584ecac569e4	Verbania	fixed	t
ceefb11a-3338-44bd-9738-37ac7f29f235	c59cf1ca-1701-476e-8045-584ecac569e4	Viola	single	t
922aef95-9a24-46a1-808e-864a93a962bf	c59cf1ca-1701-476e-8045-584ecac569e4	Giovanni	single	t
1b93f4e1-bdc1-4b5a-8b82-f5cfefc00665	c59cf1ca-1701-476e-8045-584ecac569e4	Laboratorio	single	t
f2a7a389-6991-4c51-ad13-ebad97847bb0	c59cf1ca-1701-476e-8045-584ecac569e4	Franco	single	t
6c79343e-d8e8-4c58-8df7-a1707d186c51	c59cf1ca-1701-476e-8045-584ecac569e4	Bettoni	single	t
f9ef02da-74eb-498b-be89-c9c430f45ec6	c59cf1ca-1701-476e-8045-584ecac569e4	Grandotti	fixed	t
d689d207-8fa1-483c-8d44-d6b2ba942a47	c59cf1ca-1701-476e-8045-584ecac569e4	Fonte L	fixed	t
4ac48014-73dc-403b-99e7-10e2bb8b3c51	c59cf1ca-1701-476e-8045-584ecac569e4	Mainetti L	fixed	t
\.


--
-- Data for Name: daily_item_status; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.daily_item_status (bakery_id, date, customer_id, product_id, done, variant) FROM stdin;
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-26	f5a9c339-fa39-41b5-8bc9-66370b718611	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-26	5da77be1-5979-4b52-8458-0714e4c125ae	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	35c51dce-046e-41b8-abf8-df9b318116f7	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-11	f5a9c339-fa39-41b5-8bc9-66370b718611	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-11	f5a9c339-fa39-41b5-8bc9-66370b718611	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-26	f5a9c339-fa39-41b5-8bc9-66370b718611	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-14	04063944-3993-49f1-9a3c-78c7b28317f0	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-14	04063944-3993-49f1-9a3c-78c7b28317f0	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-04-10	04063944-3993-49f1-9a3c-78c7b28317f0	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-04-10	04063944-3993-49f1-9a3c-78c7b28317f0	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-04-10	04063944-3993-49f1-9a3c-78c7b28317f0	f9008beb-4663-4ceb-bd05-eefff8739259	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	64f59ccf-be2a-4d15-ab83-94171e69a395	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-04-10	04063944-3993-49f1-9a3c-78c7b28317f0	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-04-10	04063944-3993-49f1-9a3c-78c7b28317f0	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-26	04063944-3993-49f1-9a3c-78c7b28317f0	f4665f7d-81b6-414d-9cb9-b962febfe50b	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-26	04063944-3993-49f1-9a3c-78c7b28317f0	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	04063944-3993-49f1-9a3c-78c7b28317f0	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	04063944-3993-49f1-9a3c-78c7b28317f0	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-29	0ca9feb0-22dd-4639-a9e6-250698fad811	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-29	0ca9feb0-22dd-4639-a9e6-250698fad811	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-29	0ca9feb0-22dd-4639-a9e6-250698fad811	075c301f-67e2-4bff-bcc8-2d215fcdf849	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-29	9e848de4-ef6a-4c46-9cda-b51fa0317538	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-29	9e848de4-ef6a-4c46-9cda-b51fa0317538	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-29	9e848de4-ef6a-4c46-9cda-b51fa0317538	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-29	4c330f97-0072-4a8b-b838-dd5a80e04743	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-29	4c330f97-0072-4a8b-b838-dd5a80e04743	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-29	4c330f97-0072-4a8b-b838-dd5a80e04743	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	3e08f094-ea18-4805-aeb8-3385acb35d5d	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	3e08f094-ea18-4805-aeb8-3385acb35d5d	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	3e08f094-ea18-4805-aeb8-3385acb35d5d	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	e8108da7-47ac-4a37-aa97-a735e0caf5ae	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	e8108da7-47ac-4a37-aa97-a735e0caf5ae	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	e76dcae7-c72d-4957-9aa7-d627003e5bb2	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	9bc2f9da-5cba-45f5-9c3f-540736c11e12	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	e8108da7-47ac-4a37-aa97-a735e0caf5ae	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	94610731-af1b-4ecf-bee2-4c37feee8f1d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	f4665f7d-81b6-414d-9cb9-b962febfe50b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	35c51dce-046e-41b8-abf8-df9b318116f7	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	18222ed3-19a9-44d6-a028-e6fb2068136d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	620723fb-8ddc-43c6-b1b8-24a471d05dd3	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	25149783-1d1a-4449-b54a-1068ca3405ba	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	075c301f-67e2-4bff-bcc8-2d215fcdf849	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	feebdc41-9a89-4de4-8860-6c06c81c002a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-19	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	94610731-af1b-4ecf-bee2-4c37feee8f1d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	f4665f7d-81b6-414d-9cb9-b962febfe50b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	18222ed3-19a9-44d6-a028-e6fb2068136d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	8480b77a-07cd-4b5d-8769-2af7e717b684	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	620723fb-8ddc-43c6-b1b8-24a471d05dd3	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	25149783-1d1a-4449-b54a-1068ca3405ba	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	075c301f-67e2-4bff-bcc8-2d215fcdf849	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	973d147d-0217-41bf-bec2-ab39f80af20c	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	feebdc41-9a89-4de4-8860-6c06c81c002a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	8b4a2f78-50b8-4374-a55b-a01b7aea7341	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	725caca3-1174-4f0e-8374-d00465cc932d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	e4d79a03-d550-440a-84e0-cb87a56de8a3	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	fbc92d53-9184-48c5-8fb6-08eb94762912	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	8b601429-3aa0-409c-adce-9c42a6d25736	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	a62fef1f-06a6-483c-b784-f90780697743	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	d6939926-e956-4295-96de-573dff94f2b2	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	43620106-1595-430e-b31d-a30a17304cec	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	5a4efa43-c1c3-4a3f-96b6-748a2eecbec5	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	f9008beb-4663-4ceb-bd05-eefff8739259	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	34e7679d-b1d8-40b2-8359-be4a30e1a981	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	11d5a819-8cb2-4e7f-8ca4-ab74e03f4d48	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	ae232ce5-658d-4f5e-9f20-5ae4c7fa3e32	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	8da24ed2-caf4-4b0f-bb96-964c4885ec6e	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	81c8e48f-be6f-42d2-994c-d9a02d08c852	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	b02cc935-ac79-4eba-ad33-bd16bc281a76	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	11d5a819-8cb2-4e7f-8ca4-ab74e03f4d48	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f0ae8f60-6c0b-456d-b4bc-3c2d6e8243c9	35c51dce-046e-41b8-abf8-df9b318116f7	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	a673fbc3-6270-4dc1-bb16-eec8e75aa3bc	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	6c7a870b-b025-4bc2-8b6d-c02b0f87fc00	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	eaaebe76-c3f5-440a-8962-a9928dd229a3	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	577785d6-7777-4a19-b3c0-3eab2dae76d2	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	9e848de4-ef6a-4c46-9cda-b51fa0317538	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	5741d63c-03e6-4bcf-8997-04fa15d2ce54	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	0aedcd37-9e79-4814-af35-f84cd086ae35	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	86c53372-e266-45b1-8b00-b012abb7acb2	7c5ce30a-c741-40c6-81b6-bd846f705efd	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	a0d7c395-0588-4c05-9b97-e701f8025c19	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	dda07f05-6821-4216-ac71-f3baad9927e4	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	a44a2534-7461-4ae6-aefd-f35b71b0786b	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	bc3bf050-3d02-4f1e-9cfb-2e05cd36ac92	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	0f7879c9-bdef-4c8c-84e7-6395f1c2a480	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	62048060-cd8f-4d05-a079-935b498a603d	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	62048060-cd8f-4d05-a079-935b498a603d	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-27	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	3e08f094-ea18-4805-aeb8-3385acb35d5d	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	4d6bc915-5d6b-448c-9ed2-b6ac83108f81	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	11d5a819-8cb2-4e7f-8ca4-ab74e03f4d48	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	894cbadb-9274-4cb7-811c-6ea7beb9e547	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	a673fbc3-6270-4dc1-bb16-eec8e75aa3bc	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	9bc2f9da-5cba-45f5-9c3f-540736c11e12	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	f5a9c339-fa39-41b5-8bc9-66370b718611	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	079bc3e5-9ced-4d8e-b161-aa9873237eec	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	c404a6df-578e-444b-a29a-c3e0d3e8d6b5	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	4d6bc915-5d6b-448c-9ed2-b6ac83108f81	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	f48b54f1-3b16-495d-a934-abaca0dd5b47	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	633dddf7-5b9f-41ec-bbba-6bf17153efd1	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	f5a9c339-fa39-41b5-8bc9-66370b718611	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	079bc3e5-9ced-4d8e-b161-aa9873237eec	1eea3318-ff50-409d-8759-9645f3aada40	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	ce008209-a756-42cc-9e1f-2474d021bc24	4e3e47a9-131c-4351-ac41-1bafd8c657ce	f	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	a673fbc3-6270-4dc1-bb16-eec8e75aa3bc	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f0ae8f60-6c0b-456d-b4bc-3c2d6e8243c9	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	9bc2f9da-5cba-45f5-9c3f-540736c11e12	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f0ae8f60-6c0b-456d-b4bc-3c2d6e8243c9	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f0ae8f60-6c0b-456d-b4bc-3c2d6e8243c9	f4665f7d-81b6-414d-9cb9-b962febfe50b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	633dddf7-5b9f-41ec-bbba-6bf17153efd1	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	f9008beb-4663-4ceb-bd05-eefff8739259	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	3e08f094-ea18-4805-aeb8-3385acb35d5d	4e3e47a9-131c-4351-ac41-1bafd8c657ce	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f0ae8f60-6c0b-456d-b4bc-3c2d6e8243c9	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	f4665f7d-81b6-414d-9cb9-b962febfe50b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	64f59ccf-be2a-4d15-ab83-94171e69a395	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	4bfabd30-1486-4ec4-a019-6d61f4d72086	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	35c51dce-046e-41b8-abf8-df9b318116f7	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	18222ed3-19a9-44d6-a028-e6fb2068136d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	0d15e08b-5e7f-4f56-bfe3-9c6fc4b759b8	620723fb-8ddc-43c6-b1b8-24a471d05dd3	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	0d15e08b-5e7f-4f56-bfe3-9c6fc4b759b8	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	0d15e08b-5e7f-4f56-bfe3-9c6fc4b759b8	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	0d15e08b-5e7f-4f56-bfe3-9c6fc4b759b8	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	633dddf7-5b9f-41ec-bbba-6bf17153efd1	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	4936666b-0307-4246-8fa0-81f928b7e488	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d77beea8-aee1-496d-bf77-197fe5a7d33d	e76dcae7-c72d-4957-9aa7-d627003e5bb2	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d77beea8-aee1-496d-bf77-197fe5a7d33d	f4665f7d-81b6-414d-9cb9-b962febfe50b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d77beea8-aee1-496d-bf77-197fe5a7d33d	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d77beea8-aee1-496d-bf77-197fe5a7d33d	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f0ae8f60-6c0b-456d-b4bc-3c2d6e8243c9	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d77beea8-aee1-496d-bf77-197fe5a7d33d	18222ed3-19a9-44d6-a028-e6fb2068136d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d77beea8-aee1-496d-bf77-197fe5a7d33d	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d77beea8-aee1-496d-bf77-197fe5a7d33d	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d77beea8-aee1-496d-bf77-197fe5a7d33d	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	4ac48014-73dc-403b-99e7-10e2bb8b3c51	18222ed3-19a9-44d6-a028-e6fb2068136d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	4ac48014-73dc-403b-99e7-10e2bb8b3c51	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	4ac48014-73dc-403b-99e7-10e2bb8b3c51	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	4ac48014-73dc-403b-99e7-10e2bb8b3c51	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d3d03a88-b990-4f2a-89b3-44129b6e1a8d	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d3d03a88-b990-4f2a-89b3-44129b6e1a8d	f4665f7d-81b6-414d-9cb9-b962febfe50b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d3d03a88-b990-4f2a-89b3-44129b6e1a8d	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d3d03a88-b990-4f2a-89b3-44129b6e1a8d	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d3d03a88-b990-4f2a-89b3-44129b6e1a8d	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	30ad80a0-fccd-482c-9757-cf0405e165d0	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	07cc24cc-d0c0-442c-aeec-11afc6f0374d	620723fb-8ddc-43c6-b1b8-24a471d05dd3	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	07cc24cc-d0c0-442c-aeec-11afc6f0374d	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	07cc24cc-d0c0-442c-aeec-11afc6f0374d	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	07cc24cc-d0c0-442c-aeec-11afc6f0374d	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	9793e3a6-71ed-4214-a2a4-d6c63949460f	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	9793e3a6-71ed-4214-a2a4-d6c63949460f	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	5da77be1-5979-4b52-8458-0714e4c125ae	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	18222ed3-19a9-44d6-a028-e6fb2068136d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	f4665f7d-81b6-414d-9cb9-b962febfe50b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	e76dcae7-c72d-4957-9aa7-d627003e5bb2	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	620723fb-8ddc-43c6-b1b8-24a471d05dd3	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	37d66304-d6b6-4261-a065-1be24aeb104b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	4c964f81-b74d-4fe8-a53a-e0491645336b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f48b54f1-3b16-495d-a934-abaca0dd5b47	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	3b023775-f555-424b-afbb-621523bfc6c4	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	620723fb-8ddc-43c6-b1b8-24a471d05dd3	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	18222ed3-19a9-44d6-a028-e6fb2068136d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2210a675-49eb-4b1a-9bfa-dede036e1c5d	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	970e4480-02e3-4088-b77a-8a0e74c85886	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	35c51dce-046e-41b8-abf8-df9b318116f7	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	e76dcae7-c72d-4957-9aa7-d627003e5bb2	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	075c301f-67e2-4bff-bcc8-2d215fcdf849	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	f4665f7d-81b6-414d-9cb9-b962febfe50b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	079bc3e5-9ced-4d8e-b161-aa9873237eec	1eea3318-ff50-409d-8759-9645f3aada40	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	3e08f094-ea18-4805-aeb8-3385acb35d5d	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	3e08f094-ea18-4805-aeb8-3385acb35d5d	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	30ad80a0-fccd-482c-9757-cf0405e165d0	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	30ad80a0-fccd-482c-9757-cf0405e165d0	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	30ad80a0-fccd-482c-9757-cf0405e165d0	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	30ad80a0-fccd-482c-9757-cf0405e165d0	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	30ad80a0-fccd-482c-9757-cf0405e165d0	18222ed3-19a9-44d6-a028-e6fb2068136d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	30ad80a0-fccd-482c-9757-cf0405e165d0	e76dcae7-c72d-4957-9aa7-d627003e5bb2	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	fcdeefb8-4a01-48a1-8182-4e69846adb36	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	fcdeefb8-4a01-48a1-8182-4e69846adb36	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	fcdeefb8-4a01-48a1-8182-4e69846adb36	18222ed3-19a9-44d6-a028-e6fb2068136d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	7c5ce30a-c741-40c6-81b6-bd846f705efd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	894cbadb-9274-4cb7-811c-6ea7beb9e547	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	0d15e08b-5e7f-4f56-bfe3-9c6fc4b759b8	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	0d15e08b-5e7f-4f56-bfe3-9c6fc4b759b8	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	0d15e08b-5e7f-4f56-bfe3-9c6fc4b759b8	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	fcdeefb8-4a01-48a1-8182-4e69846adb36	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	94610731-af1b-4ecf-bee2-4c37feee8f1d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	8480b77a-07cd-4b5d-8769-2af7e717b684	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	8813879e-e196-4ac4-b789-6604191de723	74545d89-0336-41f8-b100-6b1a2c8cf381	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	8813879e-e196-4ac4-b789-6604191de723	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	8813879e-e196-4ac4-b789-6604191de723	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	8813879e-e196-4ac4-b789-6604191de723	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	8813879e-e196-4ac4-b789-6604191de723	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	8813879e-e196-4ac4-b789-6604191de723	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	8813879e-e196-4ac4-b789-6604191de723	37d66304-d6b6-4261-a065-1be24aeb104b	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	8813879e-e196-4ac4-b789-6604191de723	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	19bfe055-0567-4aac-80d8-c2487cbe7ef2	176307fa-d193-4222-b90e-3e8b342e651e	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	19bfe055-0567-4aac-80d8-c2487cbe7ef2	6ba8b958-628e-424f-8040-49cfaa00985d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	19bfe055-0567-4aac-80d8-c2487cbe7ef2	0da5a062-f5c8-4c88-98af-075e5ab0a509	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f9ef02da-74eb-498b-be89-c9c430f45ec6	1ee13245-65c0-4b20-86cc-39df95635f48	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	ca613f17-e271-4112-b8a7-4ad570cb883e	35c51dce-046e-41b8-abf8-df9b318116f7	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	ca613f17-e271-4112-b8a7-4ad570cb883e	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	ca613f17-e271-4112-b8a7-4ad570cb883e	92820156-5037-4459-b7b6-8344ffabfd0d	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	ca613f17-e271-4112-b8a7-4ad570cb883e	041ef8f9-ffc1-441d-920b-168d7f2597fd	t	\N
c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	ca613f17-e271-4112-b8a7-4ad570cb883e	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	t	\N
\.


--
-- Data for Name: daily_order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.daily_order_items (id, daily_order_id, product_id, quantity, unit, done, variant, "position") FROM stdin;
174f8d34-f7cc-4e3d-b2af-652e524fd580	b7cae906-7b4b-4c9b-b26c-199a520d69f0	92820156-5037-4459-b7b6-8344ffabfd0d	2.00	kg	t	\N	7
8c37d426-015e-4b70-80f6-50f126699b29	b820e272-2d1b-43c1-8022-f90bc52e4335	075c301f-67e2-4bff-bcc8-2d215fcdf849	1.00	pieces	f	\N	10
4eb55c8e-2415-4182-a5a4-f64479769fbe	69528eac-768d-429f-ab2d-40ec771204c1	7c5ce30a-c741-40c6-81b6-bd846f705efd	10.00	pieces	f	\N	0
2f812e40-b512-4189-8c52-f57727fd8a31	69528eac-768d-429f-ab2d-40ec771204c1	92820156-5037-4459-b7b6-8344ffabfd0d	36.00	kg	f	\N	0
ef05d4d9-cc74-427b-bf71-1629d5b15600	69528eac-768d-429f-ab2d-40ec771204c1	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	f	\N	0
4a57f5ff-aaed-4557-840f-ff94a4cc39fa	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	041ef8f9-ffc1-441d-920b-168d7f2597fd	6.00	pieces	f	\N	0
3cc98e6f-720e-48a3-b711-02b6886939a4	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	f4665f7d-81b6-414d-9cb9-b962febfe50b	18.00	pieces	f	\N	1
4f63eeb0-33f2-48ee-8dc5-e28b16f603d3	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	176307fa-d193-4222-b90e-3e8b342e651e	1.00	kg	f	\N	2
06c06a2a-2627-4d21-abc0-c6e6ee3f2296	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	f	\N	3
603e084e-9be6-4ef7-8ef4-1977344379a8	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	0da5a062-f5c8-4c88-98af-075e5ab0a509	3.00	kg	f	\N	4
0c33e205-6ba2-432d-bee8-527ddb342d26	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	6ba8b958-628e-424f-8040-49cfaa00985d	1.50	kg	f	\N	5
40e8474a-4839-4a05-8b6f-075c6aba4dab	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	37d66304-d6b6-4261-a065-1be24aeb104b	6.00	pieces	f	\N	6
b0e99941-825d-46f9-8379-ca25d916b637	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	1eea3318-ff50-409d-8759-9645f3aada40	2.00	pieces	f	\N	7
9e30e22e-4eea-4d17-b24d-cb72c6a75b5d	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	t	\N	9
7f65e642-9d9b-4f87-bdcc-379ea9c8a4a6	ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	7c5ce30a-c741-40c6-81b6-bd846f705efd	1.00	pieces	f	\N	10
2b9241ca-90d4-4158-93a1-b70ce524a4f2	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	35c51dce-046e-41b8-abf8-df9b318116f7	2.00	pieces	f	\N	0
79fbe092-bc4c-4b51-a682-bf1545cdcef4	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	f	\N	1
d544240a-2f50-4d07-9aa2-01bc84ca6d44	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	94610731-af1b-4ecf-bee2-4c37feee8f1d	12.00	pieces	f	\N	2
2f4f095f-36e2-41d7-8ffd-e67071120a90	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	f4665f7d-81b6-414d-9cb9-b962febfe50b	24.00	pieces	f	\N	3
0ebb6df9-8551-404c-a7f9-3a10de204490	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	f	\N	4
f38a207c-b26d-4502-b937-1c828e481b43	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.50	kg	f	\N	5
57378b4f-1064-4f14-a0c0-41ade98be108	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	18222ed3-19a9-44d6-a028-e6fb2068136d	6.00	pieces	f	\N	6
43ed8585-0b0e-47e8-b2fe-0ac9b9ddfe54	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	0da5a062-f5c8-4c88-98af-075e5ab0a509	4.00	kg	f	\N	7
26c95231-7278-4653-8fde-7bb85ac15c98	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	f	\N	8
3ee8dd37-8339-4173-a514-2dbbded354fc	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	f	\N	10
70b5f242-de9a-4c6b-b1d6-782c1709abf4	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	f	\N	11
40af766c-ec46-4deb-ad3c-b49577f6f713	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	620723fb-8ddc-43c6-b1b8-24a471d05dd3	2.00	pieces	f	\N	12
560c055f-1210-45fe-8c28-93979036cead	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	t	\N	13
212f5de8-e03f-4eb7-9953-2d51f8fbbdca	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	2.00	pieces	f	\N	14
f059fe5c-bf37-44c7-8021-2bccc6e559bc	f38cb52b-bb0d-41d7-9da7-8b14ebeae029	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	7.00	pieces	f	\N	9
847c537a-0a53-427b-a507-a2508b5d7c60	a1682edd-b7e9-44db-a019-0911eb02cbbf	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	f	\N	1
f0296ce1-a582-4f12-b33e-37e2cd17c7cd	a1682edd-b7e9-44db-a019-0911eb02cbbf	6ba8b958-628e-424f-8040-49cfaa00985d	4.00	pieces	f	\N	3
60540ef0-e81c-4c65-937f-67fec0894e64	a1682edd-b7e9-44db-a019-0911eb02cbbf	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	f	\N	4
65b25953-05dc-4f34-b16e-06e729861c51	a1682edd-b7e9-44db-a019-0911eb02cbbf	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	f	\N	5
1f31a2a7-a930-493e-8e29-0632bf86c08b	a1682edd-b7e9-44db-a019-0911eb02cbbf	041ef8f9-ffc1-441d-920b-168d7f2597fd	15.00	pieces	f	\N	6
90281c24-fbde-468f-9565-9b8145c18118	a1682edd-b7e9-44db-a019-0911eb02cbbf	0da5a062-f5c8-4c88-98af-075e5ab0a509	20.00	pieces	f	\N	7
1a5096a3-c92c-47d4-96d1-1cddb6cec799	a1682edd-b7e9-44db-a019-0911eb02cbbf	4bfabd30-1486-4ec4-a019-6d61f4d72086	1.00	pieces	f	\N	8
4142629c-ac05-4f69-9917-e34c54b6f1ac	a1682edd-b7e9-44db-a019-0911eb02cbbf	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	f	\N	10
dedaf9db-a63d-4b00-8c9c-ae6699bf1208	a1682edd-b7e9-44db-a019-0911eb02cbbf	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	f	\N	11
13359d29-49cd-4fb3-a583-7958a06e497a	a1682edd-b7e9-44db-a019-0911eb02cbbf	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	t	\N	12
1108641f-d4a2-475a-89c2-f6231c1889a2	a1682edd-b7e9-44db-a019-0911eb02cbbf	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	f	\N	13
9a580aad-df68-4c8a-a8c0-8c2eddbc6140	a1682edd-b7e9-44db-a019-0911eb02cbbf	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	f	\N	2
5eed7f7c-bc64-4530-874d-6721993547a7	a1682edd-b7e9-44db-a019-0911eb02cbbf	18222ed3-19a9-44d6-a028-e6fb2068136d	6.00	pieces	f	\N	0
7b0d3253-314e-4d3c-b431-43fcee764934	a1682edd-b7e9-44db-a019-0911eb02cbbf	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	f	\N	9
7753b544-2cd4-4927-96bf-1622ad493966	b820e272-2d1b-43c1-8022-f90bc52e4335	6ba8b958-628e-424f-8040-49cfaa00985d	20.00	pieces	f	\N	0
4a2d3917-a4e2-4566-90d5-3b22af18cd0a	b820e272-2d1b-43c1-8022-f90bc52e4335	0da5a062-f5c8-4c88-98af-075e5ab0a509	10.00	pieces	f	\N	1
d74c97c7-e724-4cc5-9440-af8bcd262499	b820e272-2d1b-43c1-8022-f90bc52e4335	176307fa-d193-4222-b90e-3e8b342e651e	25.00	pieces	f	\N	2
5212aca7-431b-4769-9563-3b5a53fe5755	b820e272-2d1b-43c1-8022-f90bc52e4335	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	f	\N	3
0b7443f7-98e0-4018-af9c-65e4b974cf04	b820e272-2d1b-43c1-8022-f90bc52e4335	041ef8f9-ffc1-441d-920b-168d7f2597fd	6.00	pieces	f	\N	4
0e7d72f5-fd0a-453d-b09f-7f47c0b0ee1a	b820e272-2d1b-43c1-8022-f90bc52e4335	92820156-5037-4459-b7b6-8344ffabfd0d	8.00	pieces	f	\N	5
f43eefd7-5e73-4cbd-b292-16050eb5126c	b820e272-2d1b-43c1-8022-f90bc52e4335	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2.00	pieces	f	\N	6
d97fd838-7ef0-4cd9-8a44-3601e94f2cc5	b820e272-2d1b-43c1-8022-f90bc52e4335	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	f	\N	7
0db5cfad-5a90-4272-9130-d0a8cad6c124	b820e272-2d1b-43c1-8022-f90bc52e4335	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	f	\N	8
24db8ea4-5c0f-4066-b440-bce8397e1d3b	b820e272-2d1b-43c1-8022-f90bc52e4335	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	f	\N	9
7adf507e-52bd-4835-90aa-b1c9773bcec7	b820e272-2d1b-43c1-8022-f90bc52e4335	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	f	\N	11
08988b0f-a780-4459-a470-02740c90eaf0	b820e272-2d1b-43c1-8022-f90bc52e4335	7c5ce30a-c741-40c6-81b6-bd846f705efd	3.00	pieces	f	\N	12
292885f5-9860-4548-8e2a-8c418dd80d92	b820e272-2d1b-43c1-8022-f90bc52e4335	1eea3318-ff50-409d-8759-9645f3aada40	6.00	pieces	f	\N	13
eb98d567-85c6-47b9-a643-4b264834f64e	b820e272-2d1b-43c1-8022-f90bc52e4335	f9008beb-4663-4ceb-bd05-eefff8739259	1.00	pieces	f	\N	14
42fc97dc-c3d2-409b-9d94-5b9c023fcc37	5813cb61-185a-49d8-95a6-e049d1b89ea4	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	t	\N	2
0f7d5ebf-7b6c-487d-a664-68e22fdc0be5	6a10fed4-6508-4326-8342-3bf43bcf90d2	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	t	\N	1
d22c91c6-1a7b-4da8-ad80-a027c8f792e1	3d12ae59-0800-4c75-b390-3742a73ecee8	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	2.00	pieces	t	\N	1
067abc55-0e6c-4601-8ffa-9dc6eea2c761	18a50a89-6d42-4626-96df-7df45b5bf354	5a4efa43-c1c3-4a3f-96b6-748a2eecbec5	0.50	pieces	t	\N	19
b28927bb-6bfd-41ba-aa0f-311cd0d27acb	6a10fed4-6508-4326-8342-3bf43bcf90d2	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	2.00	pieces	t	\N	2
b4991b07-24d1-4b73-bade-b2f47c477158	6a10fed4-6508-4326-8342-3bf43bcf90d2	0da5a062-f5c8-4c88-98af-075e5ab0a509	5.00	pieces	t	\N	3
e91cf62a-73ed-4027-b216-1047cb6b3add	6a10fed4-6508-4326-8342-3bf43bcf90d2	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	t	\N	7
a590a9f2-3734-4148-93af-21a4fd53c886	6a10fed4-6508-4326-8342-3bf43bcf90d2	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	t	\N	4
429b5ae1-7728-47c0-9799-4e5d21cc1cb4	6a10fed4-6508-4326-8342-3bf43bcf90d2	041ef8f9-ffc1-441d-920b-168d7f2597fd	11.00	pieces	t	\N	5
e05c42e6-1277-4dea-905a-31576aaa5f14	6a10fed4-6508-4326-8342-3bf43bcf90d2	64f59ccf-be2a-4d15-ab83-94171e69a395	10.00	pieces	t	\N	6
0465edac-8408-4abf-8ad2-52cf54af8ca0	6a10fed4-6508-4326-8342-3bf43bcf90d2	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	t	\N	8
66c6a82e-e27f-4441-bd2b-a7e054129b40	6a10fed4-6508-4326-8342-3bf43bcf90d2	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	10.00	pieces	t	\N	11
44ee9901-4eef-4f08-9dc2-c0677b092da5	6a10fed4-6508-4326-8342-3bf43bcf90d2	35c51dce-046e-41b8-abf8-df9b318116f7	2.00	pieces	t	\N	10
38aa4463-0854-45f0-9fe9-15c3e23ceb52	6a10fed4-6508-4326-8342-3bf43bcf90d2	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	t	\N	9
ad8b22bd-7cd0-4a3a-99fd-bccdecd98bb4	18a50a89-6d42-4626-96df-7df45b5bf354	7c5ce30a-c741-40c6-81b6-bd846f705efd	4.00	pieces	t	\N	24
b6270415-95c1-4e28-9b55-7c5497da4dcf	18a50a89-6d42-4626-96df-7df45b5bf354	4e3e47a9-131c-4351-ac41-1bafd8c657ce	12.00	pieces	t	\N	23
4c5f26ea-c302-472a-bb20-7810e0028a9b	18a50a89-6d42-4626-96df-7df45b5bf354	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	4.00	pieces	t	\N	25
7a421ed1-abfb-4c32-b0b3-fc4cfe56614c	aac327f5-c10e-4a64-b132-7b74689dac21	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	t	\N	0
545e5dd5-18bd-421f-8499-d9ddc9201e88	b811743f-db96-40fb-b891-644135667d3c	041ef8f9-ffc1-441d-920b-168d7f2597fd	15.00	pieces	t	\N	6
14c8987f-ae0e-4735-aa2c-a6db6ae06c27	18a50a89-6d42-4626-96df-7df45b5bf354	f9008beb-4663-4ceb-bd05-eefff8739259	1.00	pieces	t	\N	21
edc07c7c-00ca-452e-9748-22ee7569796b	18a50a89-6d42-4626-96df-7df45b5bf354	1eea3318-ff50-409d-8759-9645f3aada40	6.00	pieces	t	\N	22
0360f4d2-80dc-4682-bf35-cfe737575fcd	3d12ae59-0800-4c75-b390-3742a73ecee8	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	t	\N	2
be8092c8-2866-4dfa-8293-966447f25b91	6a10fed4-6508-4326-8342-3bf43bcf90d2	7c5ce30a-c741-40c6-81b6-bd846f705efd	15.00	pieces	t	\N	12
25fcc2e2-7722-4fa0-ac57-a275e1e76dbd	6a10fed4-6508-4326-8342-3bf43bcf90d2	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	t	\N	13
95987fa1-e26d-4781-a755-edb60cb7a038	2df1f054-a9d4-4af2-8c8f-de747819ebab	041ef8f9-ffc1-441d-920b-168d7f2597fd	6.00	pieces	t	\N	0
1f702120-6b36-4538-89a3-a3a5d485c219	2df1f054-a9d4-4af2-8c8f-de747819ebab	f4665f7d-81b6-414d-9cb9-b962febfe50b	18.00	pieces	t	\N	1
8a26f042-332b-4fff-b319-5d393978a707	b811743f-db96-40fb-b891-644135667d3c	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	t	\N	2
4ded7742-dc07-4515-8726-96074f278f2a	18a50a89-6d42-4626-96df-7df45b5bf354	92820156-5037-4459-b7b6-8344ffabfd0d	2.00	kg	t	\N	6
7d47818f-aea3-4a41-a75b-8283405fd12f	b811743f-db96-40fb-b891-644135667d3c	6ba8b958-628e-424f-8040-49cfaa00985d	4.00	pieces	t	\N	3
94742661-7391-4b68-ace9-864b52c7ed31	5813cb61-185a-49d8-95a6-e049d1b89ea4	4e3e47a9-131c-4351-ac41-1bafd8c657ce	2.00	pieces	t	\N	0
69b11578-4445-4992-b970-fb830af8d8bb	18a50a89-6d42-4626-96df-7df45b5bf354	6ba8b958-628e-424f-8040-49cfaa00985d	15.00	pieces	t	\N	15
a9a6714b-240c-4201-a151-16fdbd324284	6a10fed4-6508-4326-8342-3bf43bcf90d2	f9008beb-4663-4ceb-bd05-eefff8739259	2.00	pieces	t	\N	15
284cbb66-7339-4fc9-a341-341069ed19d1	18a50a89-6d42-4626-96df-7df45b5bf354	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	4.00	pieces	t	\N	3
21a39c01-aa98-41da-bc0d-17fd3dca13fc	18a50a89-6d42-4626-96df-7df45b5bf354	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	6.00	pieces	t	\N	10
2e0d348e-1a76-4809-842d-6c466b1357e9	18a50a89-6d42-4626-96df-7df45b5bf354	e76dcae7-c72d-4957-9aa7-d627003e5bb2	15.00	pieces	t	\N	8
44002610-e703-4d81-a3ef-f3ac17155944	18a50a89-6d42-4626-96df-7df45b5bf354	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	12.00	pieces	t	\N	17
244c1c30-66b5-4fea-b43e-e948befa63ee	2df1f054-a9d4-4af2-8c8f-de747819ebab	176307fa-d193-4222-b90e-3e8b342e651e	1.00	kg	t	\N	2
4c4b28c1-ec6f-44bd-9ec9-9688ee4bf31f	18a50a89-6d42-4626-96df-7df45b5bf354	18222ed3-19a9-44d6-a028-e6fb2068136d	12.00	pieces	t	\N	16
61ebc05f-bfe5-4944-b1af-7d250c4b868f	18a50a89-6d42-4626-96df-7df45b5bf354	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	20.00	pieces	t	\N	1
9b681253-cc85-42ff-8f65-fe8ec2607a7a	18a50a89-6d42-4626-96df-7df45b5bf354	64f59ccf-be2a-4d15-ab83-94171e69a395	15.00	pieces	t	\N	14
af5b881a-ce91-46de-9ad0-1bac249bdb80	18a50a89-6d42-4626-96df-7df45b5bf354	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	t	\N	4
a4be6e21-e766-4c8f-97dc-5a305857a6bb	18a50a89-6d42-4626-96df-7df45b5bf354	176307fa-d193-4222-b90e-3e8b342e651e	120.00	pieces	t	\N	12
0084cd4d-f2a6-4391-8614-5042ac7249da	2df1f054-a9d4-4af2-8c8f-de747819ebab	0da5a062-f5c8-4c88-98af-075e5ab0a509	3.00	kg	t	\N	4
79aaddef-8765-4a50-9a8d-100147173c39	18a50a89-6d42-4626-96df-7df45b5bf354	0da5a062-f5c8-4c88-98af-075e5ab0a509	30.00	pieces	t	\N	13
32766c85-de7a-4a8d-9e85-9e6fbce31233	3d12ae59-0800-4c75-b390-3742a73ecee8	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	t	\N	0
30ba931b-78b7-4e7e-9c48-02101a8998b0	18a50a89-6d42-4626-96df-7df45b5bf354	35c51dce-046e-41b8-abf8-df9b318116f7	3.00	pieces	t	\N	7
ef38a829-63e9-400d-9052-e5992aec193d	18a50a89-6d42-4626-96df-7df45b5bf354	74545d89-0336-41f8-b100-6b1a2c8cf381	5.00	pieces	t	\N	2
3ca7141a-74d5-4573-affa-3bfba72fdbdc	18a50a89-6d42-4626-96df-7df45b5bf354	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	8.00	pieces	t	\N	5
f3440726-e9de-4b30-aebf-7bd628f052ce	18a50a89-6d42-4626-96df-7df45b5bf354	94610731-af1b-4ecf-bee2-4c37feee8f1d	15.00	pieces	t	\N	9
e75369ce-62dc-423f-a041-a481f28622a1	18a50a89-6d42-4626-96df-7df45b5bf354	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	t	\N	11
6a6b13ed-cadf-4dd7-95b7-acd6344683d4	18a50a89-6d42-4626-96df-7df45b5bf354	041ef8f9-ffc1-441d-920b-168d7f2597fd	30.00	pieces	t	\N	0
1d305057-eec0-4c81-987b-29705925c6e6	2df1f054-a9d4-4af2-8c8f-de747819ebab	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	t	\N	3
60cbd396-5a63-4743-91de-499d34acb6d7	b811743f-db96-40fb-b891-644135667d3c	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	t	\N	0
90c3ae57-a634-4bec-86c1-61b9edb277ae	b811743f-db96-40fb-b891-644135667d3c	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	t	\N	1
520f7141-2ec1-4e14-8ee1-fdf02692d185	b811743f-db96-40fb-b891-644135667d3c	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	t	\N	10
14fd56dc-860b-436d-a1a3-72b1f2d7d78f	b811743f-db96-40fb-b891-644135667d3c	4bfabd30-1486-4ec4-a019-6d61f4d72086	2.00	pieces	t	\N	8
b45e8d6d-e271-4e81-ba6a-5e2b4217979e	b811743f-db96-40fb-b891-644135667d3c	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	t	\N	4
11c635f6-6ca7-4a29-b113-2e18e18921f9	b811743f-db96-40fb-b891-644135667d3c	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	t	\N	5
17a45a62-a0ed-4004-a836-8c17c9295094	b811743f-db96-40fb-b891-644135667d3c	0da5a062-f5c8-4c88-98af-075e5ab0a509	25.00	pieces	t	\N	7
10959900-bfef-4ca3-a3fc-4bbbb88e31e5	b811743f-db96-40fb-b891-644135667d3c	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	t	\N	9
6c3111e8-5dd9-4cf8-a299-6f4e089599db	18a50a89-6d42-4626-96df-7df45b5bf354	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	t	\N	18
36cb84e2-ea70-457f-8be4-bb90969eb0b3	18a50a89-6d42-4626-96df-7df45b5bf354	43620106-1595-430e-b31d-a30a17304cec	0.50	pieces	t	\N	26
8ac81573-9797-4458-bd00-387f5e2d861e	31a4ac10-5ede-4ea8-9564-4e569e206a3e	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.00	pieces	t	\N	0
815aee06-6461-4d67-9202-84bfad1197d4	18a50a89-6d42-4626-96df-7df45b5bf354	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	2.00	pieces	t	\N	20
6848498d-56a9-40a7-8a08-3577806077c7	029e0b93-7f1a-47fb-98e5-409590140e37	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.00	pieces	t	\N	0
d2a05882-39f2-498d-b990-45f16d3c508a	029e0b93-7f1a-47fb-98e5-409590140e37	c6dfabb9-0bb9-4e18-b26d-403b7a611852	1.00	pieces	t	\N	0
72f49538-db03-4384-8a5c-f27720c52e61	029e0b93-7f1a-47fb-98e5-409590140e37	35963234-2d56-4557-973d-7e57a6646e57	1.00	pieces	t	\N	0
41c99df4-6e96-4bb3-983a-5dd1e192903e	029e0b93-7f1a-47fb-98e5-409590140e37	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	5.00	pieces	t	\N	0
efece06a-0f8a-4ccb-8894-0d361abce148	da46b907-819d-4530-90f0-9dfb194e5cab	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	t	\N	0
ae8d4a78-638d-447d-9877-aa0355daffde	b811743f-db96-40fb-b891-644135667d3c	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	t	\N	11
177935e5-0d96-47fc-8cb3-0a9ec4cbafa1	b811743f-db96-40fb-b891-644135667d3c	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	t	\N	13
efb7839e-4a55-4567-83a2-833d53c25845	b811743f-db96-40fb-b891-644135667d3c	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	t	\N	12
dd0e06cc-4763-4e2c-9a64-a2f89391966d	3e135cdb-2cbf-4757-a643-fa6dc0bc8c15	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.00	pieces	t	\N	0
fb7cdc61-1c8b-4f65-afa4-31d607f2a4fc	da46b907-819d-4530-90f0-9dfb194e5cab	176307fa-d193-4222-b90e-3e8b342e651e	75.00	pieces	t	\N	1
cb66b8db-ec26-41fd-8069-e04b94fe8bd3	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	t	\N	10
5fe28304-8a47-43b4-ad58-e6266f6e7ac9	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	35c51dce-046e-41b8-abf8-df9b318116f7	2.00	pieces	t	\N	0
39b27f84-cc22-428c-baad-4e886837614e	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	t	\N	1
b7492066-9894-4e8d-be8d-a757cc153bed	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	94610731-af1b-4ecf-bee2-4c37feee8f1d	12.00	pieces	t	\N	2
83be37e6-8ef5-48f0-a67e-b06460913dc7	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	f4665f7d-81b6-414d-9cb9-b962febfe50b	24.00	pieces	t	\N	3
8cb6f643-9659-44cb-84e7-eea88dd1a445	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	t	\N	4
4481317d-b3a1-4403-9a7e-267c7874c825	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.50	kg	t	\N	5
ac703e33-46c1-4a46-8e96-a768317b9258	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	18222ed3-19a9-44d6-a028-e6fb2068136d	6.00	pieces	t	\N	6
c5ed27f2-97b0-41bb-bab2-92333271fcef	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	0da5a062-f5c8-4c88-98af-075e5ab0a509	4.00	kg	t	\N	7
56964c3f-4a14-4439-841a-87f70756b7b7	4995e748-24de-4cf2-95f1-fa0c5dea1793	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	19.00	pieces	t	\N	1
542a874d-bce5-4ecc-9a12-30f0cafc3782	b7cae906-7b4b-4c9b-b26c-199a520d69f0	8480b77a-07cd-4b5d-8769-2af7e717b684	2.00	pieces	t	\N	18
28c5f0f0-a6ff-462e-9926-805bb846cf79	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	7.00	pieces	t	\N	9
48aabb60-71da-430e-af11-20d8107d92ec	b7cae906-7b4b-4c9b-b26c-199a520d69f0	74545d89-0336-41f8-b100-6b1a2c8cf381	8.00	pieces	t	\N	2
910617c6-a9f8-42f2-99c3-85a7d670f86a	f3a1b501-ee78-4ae4-b7ed-4a567439ee6a	041ef8f9-ffc1-441d-920b-168d7f2597fd	5.00	pieces	t	\N	1
d81033d8-d2fd-477d-bbfb-4006a5f2d24c	2df1f054-a9d4-4af2-8c8f-de747819ebab	6ba8b958-628e-424f-8040-49cfaa00985d	1.50	kg	t	\N	5
e9cca3e4-3590-4446-ac52-e4b6ef038027	b7cae906-7b4b-4c9b-b26c-199a520d69f0	4e3e47a9-131c-4351-ac41-1bafd8c657ce	10.00	pieces	t	\N	19
89c297f8-ac1a-41d8-a813-1009cfb122cb	b7cae906-7b4b-4c9b-b26c-199a520d69f0	7c5ce30a-c741-40c6-81b6-bd846f705efd	5.00	pieces	t	\N	20
be9417b2-1a18-4750-9ae5-8bc402e86f0e	c1e7f47c-b938-47fc-9707-e2f8795ffaa9	4e3e47a9-131c-4351-ac41-1bafd8c657ce	6.00	pieces	t	\N	0
5b03124d-3ef2-4548-a1c2-a6bd62fe5451	2df1f054-a9d4-4af2-8c8f-de747819ebab	7c5ce30a-c741-40c6-81b6-bd846f705efd	1.00	pieces	t	\N	10
0182920e-a8e5-4e6b-a4d8-60499ac18c96	2df1f054-a9d4-4af2-8c8f-de747819ebab	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	t	\N	9
3969eac7-2da4-4d60-b155-82fcebbb76af	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	7c5ce30a-c741-40c6-81b6-bd846f705efd	1.00	pieces	t	\N	14
b0e99924-7e46-43f5-96e4-5543c61f69f5	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	t	\N	13
bbc605d4-6c08-4697-b425-36f2228946dc	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	t	\N	14
37239c27-ad92-46d3-b06d-0bbce5132cba	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	2.00	pieces	t	\N	15
94eb8fd2-0f0d-4739-aa1f-ff8fb935acb2	b7cae906-7b4b-4c9b-b26c-199a520d69f0	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.50	pieces	t	\N	21
371677f4-1a01-4153-8154-4c88a9726471	2df1f054-a9d4-4af2-8c8f-de747819ebab	1eea3318-ff50-409d-8759-9645f3aada40	2.00	pieces	t	\N	7
b816747a-f126-4e57-8dff-f074bb8baf70	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.00	pieces	t	\N	12
a5004147-b56c-4227-ad4b-6205fef0fafb	b7cae906-7b4b-4c9b-b26c-199a520d69f0	f9008beb-4663-4ceb-bd05-eefff8739259	2.00	pieces	t	\N	23
e1290300-05c6-4b5a-a38d-cfa260ac2419	b7cae906-7b4b-4c9b-b26c-199a520d69f0	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	t	\N	22
9b687e54-5725-4358-b7d8-58484d7fad75	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	t	\N	4
acc0243c-0cd2-4dcd-a700-48f68f0bd676	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2.00	pieces	t	\N	7
4140d672-93e1-4bac-8252-6aecce54d865	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	176307fa-d193-4222-b90e-3e8b342e651e	2.00	kg	t	\N	6
538db514-99dc-4f6a-b0d2-9ac673436516	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	3.00	pieces	t	\N	1
17cbae48-1b9d-4deb-b883-74b840165c69	3e135cdb-2cbf-4757-a643-fa6dc0bc8c15	8480b77a-07cd-4b5d-8769-2af7e717b684	8.00	pieces	t	\N	5
2cffbcce-f140-4fdf-9621-93f64c3a0878	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	t	\N	8
1ecd40fe-b999-46ae-8e1b-a472c9731597	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	620723fb-8ddc-43c6-b1b8-24a471d05dd3	8.00	pieces	t	\N	2
afbf9e5e-679e-498f-b527-b08bd2d77fde	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	74545d89-0336-41f8-b100-6b1a2c8cf381	5.00	pieces	t	\N	9
be95b2f7-9419-4628-b14b-b2fe8f9ed575	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	041ef8f9-ffc1-441d-920b-168d7f2597fd	10.00	pieces	t	\N	5
e0e9221f-898a-4c96-ad2d-843e19c2da59	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	64f59ccf-be2a-4d15-ab83-94171e69a395	15.00	pieces	t	\N	8
86f4e9cd-12ae-4d68-8895-9e37ddbae00e	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	8480b77a-07cd-4b5d-8769-2af7e717b684	8.00	pieces	t	\N	0
bb65e5df-bf28-480c-85ad-1c6a6226a1bb	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	t	\N	3
8e81c6ae-5e98-4b17-8bcf-7001bf459f13	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	185ec9ab-7b36-458f-b345-7ff7e7f592c4	20.00	pieces	t	\N	15
ee5c3481-d07f-44f3-ba50-4c84a90f9393	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	3ad5eb00-141e-47bf-9365-27847448344f	20.00	pieces	t	\N	16
5c16cf61-239d-496f-8699-237ea66549fd	4995e748-24de-4cf2-95f1-fa0c5dea1793	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	8.00	pieces	t	\N	0
52555b47-91e6-4037-b2bc-49dbcfe76627	b7cae906-7b4b-4c9b-b26c-199a520d69f0	0da5a062-f5c8-4c88-98af-075e5ab0a509	3.50	kg	t	\N	9
fdb76801-08f4-45d5-92fb-88e954763ea0	f3a1b501-ee78-4ae4-b7ed-4a567439ee6a	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	t	\N	2
00ab1160-e939-4016-9ce3-33b86244e422	f3a1b501-ee78-4ae4-b7ed-4a567439ee6a	0da5a062-f5c8-4c88-98af-075e5ab0a509	20.00	pieces	t	\N	0
8bd7c729-87e1-4e5a-9770-88e42932a1f9	2df1f054-a9d4-4af2-8c8f-de747819ebab	37d66304-d6b6-4261-a065-1be24aeb104b	6.00	pieces	t	\N	6
99144a2c-b3e2-4d77-ad08-9ffebec2f07d	2df1f054-a9d4-4af2-8c8f-de747819ebab	18222ed3-19a9-44d6-a028-e6fb2068136d	2.00	pieces	t	\N	11
1b0c441c-170e-4523-815a-1f05fcb30af8	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	t	\N	10
22877bdd-3f3d-4f15-a8ca-5134f28e70a8	9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	43620106-1595-430e-b31d-a30a17304cec	0.50	pieces	t	\N	11
4f392625-357d-4132-aa38-68ecaec4add7	8fa5da41-2933-46dd-b934-866f3d2b002e	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	t	\N	0
5fad8776-0312-4f0e-983f-c52da47758f1	8fa5da41-2933-46dd-b934-866f3d2b002e	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	t	\N	0
35e5e497-aac1-4b3b-9b30-e1baa88fcc11	c1e7f47c-b938-47fc-9707-e2f8795ffaa9	8f9c3c34-d2ac-46f9-b3a7-97943a02fe06	1.00	pieces	t	\N	0
07b3f2d8-0fa2-46da-961b-60ed1d35f090	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	t	\N	11
feb86c24-0634-42de-bc4f-be1bc0f657ae	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	620723fb-8ddc-43c6-b1b8-24a471d05dd3	2.00	pieces	t	\N	12
bd9073a0-490e-4b45-a8c3-5bfe5aa7f7ff	25f89fe0-0fbb-4af5-9406-87e97fd66b7c	fbc92d53-9184-48c5-8fb6-08eb94762912	1.00	pieces	t	\N	13
e0b18395-0d84-4e26-8aba-7e8c4cc9fc1c	3e135cdb-2cbf-4757-a643-fa6dc0bc8c15	a62fef1f-06a6-483c-b784-f90780697743	8.00	pieces	t	\N	1
ce92d498-7e78-4dbf-8640-72988ea62cc9	3e135cdb-2cbf-4757-a643-fa6dc0bc8c15	8b601429-3aa0-409c-adce-9c42a6d25736	5.00	pieces	t	\N	2
3c6fdf79-e1bb-4880-898b-9922e3512feb	3e135cdb-2cbf-4757-a643-fa6dc0bc8c15	d6939926-e956-4295-96de-573dff94f2b2	5.00	pieces	t	\N	3
7683c00c-f9fb-4d92-9205-9738bf3cbff7	3e135cdb-2cbf-4757-a643-fa6dc0bc8c15	8f9c3c34-d2ac-46f9-b3a7-97943a02fe06	5.00	pieces	t	\N	4
3a8ce17b-b1e9-4bd6-81b3-3afb6d331b12	b7cae906-7b4b-4c9b-b26c-199a520d69f0	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	t	\N	0
5ce1f5c3-5b9d-46da-93dd-33d0059fab97	b7cae906-7b4b-4c9b-b26c-199a520d69f0	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	5.00	pieces	t	\N	1
815395a3-2121-40ec-aa3c-2ab9acf924de	b7cae906-7b4b-4c9b-b26c-199a520d69f0	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	15.00	pieces	t	\N	3
78bedd5a-1b92-4d45-b6a8-83be43ec75cf	b7cae906-7b4b-4c9b-b26c-199a520d69f0	f4665f7d-81b6-414d-9cb9-b962febfe50b	0.50	kg	t	\N	4
5f38e3d0-4203-4b48-9f48-dc5fc99a455e	b7cae906-7b4b-4c9b-b26c-199a520d69f0	94610731-af1b-4ecf-bee2-4c37feee8f1d	0.50	kg	t	\N	5
9ea1b9c1-bd3c-4299-b82f-82d5d0560e10	b7cae906-7b4b-4c9b-b26c-199a520d69f0	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.50	kg	t	\N	6
e2bb1e4a-fc65-432b-8cb4-5468ced7ef66	b7cae906-7b4b-4c9b-b26c-199a520d69f0	18222ed3-19a9-44d6-a028-e6fb2068136d	10.00	pieces	t	\N	8
91fd60bd-35d2-4c2d-b04b-6b6cb7f00296	b7cae906-7b4b-4c9b-b26c-199a520d69f0	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	t	\N	10
c27e824d-f70b-4bab-af94-2f7c83957e55	b7cae906-7b4b-4c9b-b26c-199a520d69f0	64f59ccf-be2a-4d15-ab83-94171e69a395	2.00	kg	t	\N	11
a16d5fbc-d274-43f6-8c63-feb619b65903	b7cae906-7b4b-4c9b-b26c-199a520d69f0	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	15.00	pieces	t	\N	12
125c9af3-382c-43bb-9b9e-1346576d7dc6	b7cae906-7b4b-4c9b-b26c-199a520d69f0	35c51dce-046e-41b8-abf8-df9b318116f7	4.00	pieces	t	\N	13
c075a5e4-0993-4c56-88eb-163dcbbee9c0	b7cae906-7b4b-4c9b-b26c-199a520d69f0	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	10.00	pieces	t	\N	14
e986866f-0a95-4bc9-8fb5-89ced3423362	b7cae906-7b4b-4c9b-b26c-199a520d69f0	6ba8b958-628e-424f-8040-49cfaa00985d	2.00	kg	t	\N	15
aec3b72d-9c21-4bfa-8ee5-4227e2e72661	b7cae906-7b4b-4c9b-b26c-199a520d69f0	e76dcae7-c72d-4957-9aa7-d627003e5bb2	1.00	kg	t	\N	16
75180a2b-e1c8-429a-a83e-cec07a991dc7	b7cae906-7b4b-4c9b-b26c-199a520d69f0	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	16.00	pieces	t	\N	17
8f2a27fb-415f-4ba6-a41c-0621f1b47572	f3ec4b37-e9b0-407a-a2b6-ba409bb18767	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	3.00	pieces	t	\N	6
d1c8e470-8b4a-46d8-8bed-cd89951c5cf4	f3ec4b37-e9b0-407a-a2b6-ba409bb18767	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	t	\N	7
80e0747a-e1d0-4036-adf6-15beb3939592	f3ec4b37-e9b0-407a-a2b6-ba409bb18767	041ef8f9-ffc1-441d-920b-168d7f2597fd	2.00	kg	t	\N	2
9c8d523a-4505-443b-bf7a-ce7fb91d8059	f3ec4b37-e9b0-407a-a2b6-ba409bb18767	18222ed3-19a9-44d6-a028-e6fb2068136d	4.00	pieces	t	\N	5
f01a39fd-d46c-4e31-9448-bb9272194a92	f3ec4b37-e9b0-407a-a2b6-ba409bb18767	0da5a062-f5c8-4c88-98af-075e5ab0a509	6.00	kg	t	\N	0
88c19c5b-64bd-49e9-8c19-52a2ce219e87	f3ec4b37-e9b0-407a-a2b6-ba409bb18767	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	4.00	pieces	t	\N	4
80dc7727-1794-43a2-a877-44d12a1a90dd	c1e7f47c-b938-47fc-9707-e2f8795ffaa9	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	t	\N	0
08962668-9fca-4010-888f-8ae884c9b0fd	4995e748-24de-4cf2-95f1-fa0c5dea1793	74545d89-0336-41f8-b100-6b1a2c8cf381	5.00	pieces	t	\N	3
d7b43ced-8547-4fe6-a41a-381ba641d02d	4995e748-24de-4cf2-95f1-fa0c5dea1793	0da5a062-f5c8-4c88-98af-075e5ab0a509	2.00	kg	t	\N	2
57981bff-e275-428e-828d-4f1e087f6212	2634335e-7795-40d7-8410-8146212ee0fa	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	t	\N	0
e8cdaf04-c1c9-4fec-8d54-73cc1334e2d3	2634335e-7795-40d7-8410-8146212ee0fa	041ef8f9-ffc1-441d-920b-168d7f2597fd	5.00	pieces	t	\N	1
55ef2734-1b22-42bc-bf23-c700368d5ecc	2634335e-7795-40d7-8410-8146212ee0fa	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	6.00	pieces	t	\N	4
7b6c3af3-e9b3-42c4-a746-2ebcb868f656	2634335e-7795-40d7-8410-8146212ee0fa	94610731-af1b-4ecf-bee2-4c37feee8f1d	4.00	pieces	t	\N	2
d9a028e2-d7dd-46a7-b2cd-cb3126106954	2634335e-7795-40d7-8410-8146212ee0fa	e76dcae7-c72d-4957-9aa7-d627003e5bb2	2.00	pieces	t	\N	3
f8f44710-6fef-406c-a6b9-ca5c8dcbb0ab	2634335e-7795-40d7-8410-8146212ee0fa	6ba8b958-628e-424f-8040-49cfaa00985d	6.00	pieces	t	\N	5
39f0108e-6350-4eec-887e-01295cf7b25e	2634335e-7795-40d7-8410-8146212ee0fa	0da5a062-f5c8-4c88-98af-075e5ab0a509	10.00	pieces	t	\N	6
fe5c6fa6-c755-4829-af75-33bbd1e0d397	2634335e-7795-40d7-8410-8146212ee0fa	92820156-5037-4459-b7b6-8344ffabfd0d	14.00	pieces	t	\N	7
80be1398-51b0-48fc-aab7-6156187363b6	2634335e-7795-40d7-8410-8146212ee0fa	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	t	\N	8
186f0468-3b41-426f-aa38-d3cce9b5f58f	f3ec4b37-e9b0-407a-a2b6-ba409bb18767	92820156-5037-4459-b7b6-8344ffabfd0d	3.00	kg	t	\N	3
6d0cc638-f526-4b83-a9c5-888fdc9ae641	f3ec4b37-e9b0-407a-a2b6-ba409bb18767	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	t	\N	1
\.


--
-- Data for Name: daily_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.daily_orders (id, bakery_id, date, customer_id) FROM stdin;
69528eac-768d-429f-ab2d-40ec771204c1	c59cf1ca-1701-476e-8045-584ecac569e4	2026-05-13	f5a9c339-fa39-41b5-8bc9-66370b718611
ce84ec3b-af08-40d3-b7f3-2e7d0263f4ac	c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	ae232ce5-658d-4f5e-9f20-5ae4c7fa3e32
7cab56ba-bf0d-410a-8eb8-466a29abb6ae	c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	6f486bb1-d469-488d-a000-936fd09668e0
f38cb52b-bb0d-41d7-9da7-8b14ebeae029	c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	0dab90bf-6bc0-41e0-96cc-74d26e6d603d
a1682edd-b7e9-44db-a019-0911eb02cbbf	c59cf1ca-1701-476e-8045-584ecac569e4	2026-06-29	fb04fe78-9d1e-4a9b-80ba-508735c81f51
b820e272-2d1b-43c1-8022-f90bc52e4335	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-03	079bc3e5-9ced-4d8e-b161-aa9873237eec
6a10fed4-6508-4326-8342-3bf43bcf90d2	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f5a9c339-fa39-41b5-8bc9-66370b718611
aac327f5-c10e-4a64-b132-7b74689dac21	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	a44a2534-7461-4ae6-aefd-f35b71b0786b
18a50a89-6d42-4626-96df-7df45b5bf354	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	ce008209-a756-42cc-9e1f-2474d021bc24
5813cb61-185a-49d8-95a6-e049d1b89ea4	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	9e848de4-ef6a-4c46-9cda-b51fa0317538
3d12ae59-0800-4c75-b390-3742a73ecee8	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	c404a6df-578e-444b-a29a-c3e0d3e8d6b5
31a4ac10-5ede-4ea8-9564-4e569e206a3e	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	ceefb11a-3338-44bd-9738-37ac7f29f235
b811743f-db96-40fb-b891-644135667d3c	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	fb04fe78-9d1e-4a9b-80ba-508735c81f51
029e0b93-7f1a-47fb-98e5-409590140e37	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	922aef95-9a24-46a1-808e-864a93a962bf
da46b907-819d-4530-90f0-9dfb194e5cab	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	1b93f4e1-bdc1-4b5a-8b82-f5cfefc00665
3e135cdb-2cbf-4757-a643-fa6dc0bc8c15	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	f2a7a389-6991-4c51-ad13-ebad97847bb0
2df1f054-a9d4-4af2-8c8f-de747819ebab	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	ae232ce5-658d-4f5e-9f20-5ae4c7fa3e32
8fa5da41-2933-46dd-b934-866f3d2b002e	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	bc3bf050-3d02-4f1e-9cfb-2e05cd36ac92
25f89fe0-0fbb-4af5-9406-87e97fd66b7c	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	0dab90bf-6bc0-41e0-96cc-74d26e6d603d
58afa58d-e0f3-43e3-aa3a-f8137f4a6208	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	6f486bb1-d469-488d-a000-936fd09668e0
4995e748-24de-4cf2-95f1-fa0c5dea1793	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	c3a1d2b8-df74-476e-a583-7b417af23d47
c1e7f47c-b938-47fc-9707-e2f8795ffaa9	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	6c79343e-d8e8-4c58-8df7-a1707d186c51
b7cae906-7b4b-4c9b-b26c-199a520d69f0	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	4d6bc915-5d6b-448c-9ed2-b6ac83108f81
f3a1b501-ee78-4ae4-b7ed-4a567439ee6a	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	21d59b57-1639-4b62-8639-5313e246bf7f
9eeeb2e2-f771-4930-8b55-6d9b376fbe6a	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	d689d207-8fa1-483c-8d44-d6b2ba942a47
f3ec4b37-e9b0-407a-a2b6-ba409bb18767	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	3edade55-dc29-41ca-96b4-e8112b690417
2634335e-7795-40d7-8410-8146212ee0fa	c59cf1ca-1701-476e-8045-584ecac569e4	2026-07-06	8a3bce96-f4e0-4d17-918b-8bd0232a4ef8
\.


--
-- Data for Name: divisors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.divisors (bakery_id, product_id, value) FROM stdin;
c59cf1ca-1701-476e-8045-584ecac569e4	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	6
c59cf1ca-1701-476e-8045-584ecac569e4	34e7679d-b1d8-40b2-8359-be4a30e1a981	4
c59cf1ca-1701-476e-8045-584ecac569e4	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1
c59cf1ca-1701-476e-8045-584ecac569e4	c6dfabb9-0bb9-4e18-b26d-403b7a611852	1
c59cf1ca-1701-476e-8045-584ecac569e4	64f59ccf-be2a-4d15-ab83-94171e69a395	12
c59cf1ca-1701-476e-8045-584ecac569e4	0da5a062-f5c8-4c88-98af-075e5ab0a509	15
c59cf1ca-1701-476e-8045-584ecac569e4	176307fa-d193-4222-b90e-3e8b342e651e	30
c59cf1ca-1701-476e-8045-584ecac569e4	041ef8f9-ffc1-441d-920b-168d7f2597fd	30
c59cf1ca-1701-476e-8045-584ecac569e4	f4665f7d-81b6-414d-9cb9-b962febfe50b	30
c59cf1ca-1701-476e-8045-584ecac569e4	92820156-5037-4459-b7b6-8344ffabfd0d	30
c59cf1ca-1701-476e-8045-584ecac569e4	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	30
c59cf1ca-1701-476e-8045-584ecac569e4	4e3e47a9-131c-4351-ac41-1bafd8c657ce	1
c59cf1ca-1701-476e-8045-584ecac569e4	7c5ce30a-c741-40c6-81b6-bd846f705efd	1
c59cf1ca-1701-476e-8045-584ecac569e4	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2
c59cf1ca-1701-476e-8045-584ecac569e4	6ba8b958-628e-424f-8040-49cfaa00985d	12
c59cf1ca-1701-476e-8045-584ecac569e4	94610731-af1b-4ecf-bee2-4c37feee8f1d	30
c59cf1ca-1701-476e-8045-584ecac569e4	e76dcae7-c72d-4957-9aa7-d627003e5bb2	30
c59cf1ca-1701-476e-8045-584ecac569e4	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	30
\.


--
-- Data for Name: production_group_sections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.production_group_sections (group_id, section_id) FROM stdin;
74c8cbdd-35f8-4c52-9aae-ee4bf0ef9f67	7323cd80-0277-4018-b8b1-b7fa492e3d53
28fe1bc1-b3f6-497d-b36a-e32a86bf2c51	9857c383-4882-4cef-b54d-bb826aad3c0b
336aff87-195f-45ea-9c52-eabea95cc40f	9b52e186-55ff-4764-93c6-baf6d318706b
336aff87-195f-45ea-9c52-eabea95cc40f	a6ff3047-f0c0-4460-b154-fcc75bce65f7
336aff87-195f-45ea-9c52-eabea95cc40f	1ebcb358-4dc0-47fd-8a69-b0aca4ed63d1
\.


--
-- Data for Name: production_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.production_groups (id, bakery_id, name, "order", display_mode) FROM stdin;
336aff87-195f-45ea-9c52-eabea95cc40f	c59cf1ca-1701-476e-8045-584ecac569e4	Pizze	4	by-section
74c8cbdd-35f8-4c52-9aae-ee4bf0ef9f67	c59cf1ca-1701-476e-8045-584ecac569e4	Pane alla frutta	6	by-article
28fe1bc1-b3f6-497d-b36a-e32a86bf2c51	c59cf1ca-1701-476e-8045-584ecac569e4	Cornetti	3	by-article
eb223673-9d37-462f-9284-f298358d70d7	c59cf1ca-1701-476e-8045-584ecac569e4	Torte	5	by-section
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, bakery_id, name, section_id, unit, pieces_per_kg, additions_watch) FROM stdin;
4e3e47a9-131c-4351-ac41-1bafd8c657ce	c59cf1ca-1701-476e-8045-584ecac569e4	Cornetto albicocca	9857c383-4882-4cef-b54d-bb826aad3c0b	pieces	\N	f
34e7679d-b1d8-40b2-8359-be4a30e1a981	c59cf1ca-1701-476e-8045-584ecac569e4	Veneziana	9857c383-4882-4cef-b54d-bb826aad3c0b	pieces	\N	f
1297e8d7-e95a-4b0b-95f6-d386fbeb8d6f	c59cf1ca-1701-476e-8045-584ecac569e4	PIC. ALBICOCCA	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
bb412417-788c-46c7-ad02-582b8214cbe8	c59cf1ca-1701-476e-8045-584ecac569e4	PIC. MELE	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
1de822ce-23af-4f77-9a6f-cc7639c1c135	c59cf1ca-1701-476e-8045-584ecac569e4	PIC. PERE	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
7264bad4-a66c-4602-b9a4-dd59f9e3e74c	c59cf1ca-1701-476e-8045-584ecac569e4	CROSTATA ALBICOCCA	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
25298841-97cb-4c55-8de8-32e0ff6185b1	c59cf1ca-1701-476e-8045-584ecac569e4	CROSTATA MIRTILLO	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
29293c58-721f-4578-87a1-3f623a96bf40	c59cf1ca-1701-476e-8045-584ecac569e4	CROSTATA LAMPONE	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
535d3ca3-c184-4628-bd0a-6ba60e6190a1	c59cf1ca-1701-476e-8045-584ecac569e4	CROSTATA LIMONE	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
2a74eebb-1186-4a27-ae0a-2e951eb23735	c59cf1ca-1701-476e-8045-584ecac569e4	TEGLIA CROSTATA ALBICOCCA	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
af811c60-6130-498f-a63d-2f02fdc72aa5	c59cf1ca-1701-476e-8045-584ecac569e4	TEGLIA CROSTATA MIRTILLO	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
4a6ad341-8de0-4794-b8d3-78f0b932d63e	c59cf1ca-1701-476e-8045-584ecac569e4	TEGLIA CROSTATA LAMPONE	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
7b574ff4-62ad-46ea-b511-ee1155e703ed	c59cf1ca-1701-476e-8045-584ecac569e4	TEGLIA CROSTATA LIMONE	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
7c32447a-3447-4923-ab22-7e38af33065d	c59cf1ca-1701-476e-8045-584ecac569e4	TEGLIA MELE	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
3764eef4-4d4f-470f-af95-7a49670072fa	c59cf1ca-1701-476e-8045-584ecac569e4	TEGLIA PERE E CIOC	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
08436fc4-1761-4f1b-bb0b-aa0e5992d2d4	c59cf1ca-1701-476e-8045-584ecac569e4	TEGLIA ALBICOCCA E AMARETTO	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
ba8886e9-bcb9-4e43-9f37-4d1126902ff9	c59cf1ca-1701-476e-8045-584ecac569e4	TEGLIA BI GUSTO	f5f842cb-bdef-4b10-9148-5aa597fbb4b5	pieces	\N	f
594f39b7-b451-4c3c-891b-72bc861f5f5d	c59cf1ca-1701-476e-8045-584ecac569e4	Tarallo olive e capperi	fa0fe3cc-f061-454b-9ccb-2414ff773744	pieces	\N	f
570038f7-24af-4ffe-94f8-fa28422be0e5	c59cf1ca-1701-476e-8045-584ecac569e4	Torte salate	2e39ca0b-f486-4e8a-a6f4-1becd07bfa79	pieces	\N	f
4fef1be1-cb3b-41a2-a8a0-bcaff3898ae8	c59cf1ca-1701-476e-8045-584ecac569e4	Salatini	2e39ca0b-f486-4e8a-a6f4-1becd07bfa79	pieces	\N	f
835e7421-2fed-4c6f-bb85-25ac46e103a9	c59cf1ca-1701-476e-8045-584ecac569e4	Pizzette	2e39ca0b-f486-4e8a-a6f4-1becd07bfa79	pieces	\N	f
a144d439-2b1a-41ee-bdbe-487b3423b642	c59cf1ca-1701-476e-8045-584ecac569e4	Quadrotto croccante Ornella	7c503445-e49c-4edc-bac2-cfba4e888e41	pieces	\N	f
0c0415c1-f70a-4a73-8430-0415e09d1e2e	c59cf1ca-1701-476e-8045-584ecac569e4	Pane alle olive	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	c59cf1ca-1701-476e-8045-584ecac569e4	Cornetto cioccolato	9857c383-4882-4cef-b54d-bb826aad3c0b	pieces	\N	f
6ba8b958-628e-424f-8040-49cfaa00985d	c59cf1ca-1701-476e-8045-584ecac569e4	Ciabattina bianca (XB)	b086e936-57e5-46fa-a38e-51108e627e3b	kg	14	f
7c5ce30a-c741-40c6-81b6-bd846f705efd	c59cf1ca-1701-476e-8045-584ecac569e4	Cornetto b	9857c383-4882-4cef-b54d-bb826aad3c0b	pieces	\N	f
970e4480-02e3-4088-b77a-8a0e74c85886	c59cf1ca-1701-476e-8045-584ecac569e4	Panone bianco	b086e936-57e5-46fa-a38e-51108e627e3b	pieces	\N	f
540d39ee-bb8e-440d-a2fd-112aa22c1fa5	c59cf1ca-1701-476e-8045-584ecac569e4	FOCACCIA OLIVE	a6ff3047-f0c0-4460-b154-fcc75bce65f7	pieces	\N	f
8480b77a-07cd-4b5d-8769-2af7e717b684	c59cf1ca-1701-476e-8045-584ecac569e4	Panone tondo	7c503445-e49c-4edc-bac2-cfba4e888e41	pieces	\N	f
19d26861-9882-4ce9-8dfc-27b9d8a1d66c	c59cf1ca-1701-476e-8045-584ecac569e4	Panone lungo	7c503445-e49c-4edc-bac2-cfba4e888e41	kg	2	f
18222ed3-19a9-44d6-a028-e6fb2068136d	c59cf1ca-1701-476e-8045-584ecac569e4	Ciabatta ---D	7c503445-e49c-4edc-bac2-cfba4e888e41	kg	4	f
4bfabd30-1486-4ec4-a019-6d61f4d72086	c59cf1ca-1701-476e-8045-584ecac569e4	Rustico	7c503445-e49c-4edc-bac2-cfba4e888e41	pieces	\N	f
eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	c59cf1ca-1701-476e-8045-584ecac569e4	Biova	b086e936-57e5-46fa-a38e-51108e627e3b	pieces	\N	f
74545d89-0336-41f8-b100-6b1a2c8cf381	c59cf1ca-1701-476e-8045-584ecac569e4	Cereali	0de1bd01-a5eb-43b0-b907-7508f48922f7	pieces	\N	f
620723fb-8ddc-43c6-b1b8-24a471d05dd3	c59cf1ca-1701-476e-8045-584ecac569e4	Nero tondo	0de1bd01-a5eb-43b0-b907-7508f48922f7	pieces	\N	f
89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	c59cf1ca-1701-476e-8045-584ecac569e4	Nero lungo	0de1bd01-a5eb-43b0-b907-7508f48922f7	pieces	\N	f
fbc92d53-9184-48c5-8fb6-08eb94762912	c59cf1ca-1701-476e-8045-584ecac569e4	Bauletto	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
feebdc41-9a89-4de4-8860-6c06c81c002a	c59cf1ca-1701-476e-8045-584ecac569e4	Tuminia	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
973d147d-0217-41bf-bec2-ab39f80af20c	c59cf1ca-1701-476e-8045-584ecac569e4	Segale	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
25149783-1d1a-4449-b54a-1068ca3405ba	c59cf1ca-1701-476e-8045-584ecac569e4	Cereali M	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
075c301f-67e2-4bff-bcc8-2d215fcdf849	c59cf1ca-1701-476e-8045-584ecac569e4	Antico	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
46ecc1c7-459c-418d-a2ae-d336c9052445	c59cf1ca-1701-476e-8045-584ecac569e4	Antico piccolo	7161eb07-8905-4420-9110-254473ef1a59	kg	5	f
0a945f63-467f-441c-8fa6-4d56197494c4	c59cf1ca-1701-476e-8045-584ecac569e4	Antico 1,5 Kg	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
1ee6ce11-fb15-44da-878a-267cbdd0b03a	c59cf1ca-1701-476e-8045-584ecac569e4	Antico bianco	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
6c7dda60-2444-4ee0-8eb0-5a30ea2ccbca	c59cf1ca-1701-476e-8045-584ecac569e4	Antico 3 Kg	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	c59cf1ca-1701-476e-8045-584ecac569e4	Ciabatta madre	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
8b601429-3aa0-409c-adce-9c42a6d25736	c59cf1ca-1701-476e-8045-584ecac569e4	Piotta	7323cd80-0277-4018-b8b1-b7fa492e3d53	pieces	\N	f
a62fef1f-06a6-483c-b784-f90780697743	c59cf1ca-1701-476e-8045-584ecac569e4	Pane uva	7323cd80-0277-4018-b8b1-b7fa492e3d53	pieces	\N	f
aab57df5-7c6d-4719-936e-57fc47661d16	c59cf1ca-1701-476e-8045-584ecac569e4	Valzer	7323cd80-0277-4018-b8b1-b7fa492e3d53	pieces	\N	f
8f9c3c34-d2ac-46f9-b3a7-97943a02fe06	c59cf1ca-1701-476e-8045-584ecac569e4	Strudel	7323cd80-0277-4018-b8b1-b7fa492e3d53	pieces	\N	f
f4665f7d-81b6-414d-9cb9-b962febfe50b	c59cf1ca-1701-476e-8045-584ecac569e4	Bananine	b086e936-57e5-46fa-a38e-51108e627e3b	kg	25	f
35c51dce-046e-41b8-abf8-df9b318116f7	c59cf1ca-1701-476e-8045-584ecac569e4	Ciabatta comune	b086e936-57e5-46fa-a38e-51108e627e3b	kg	4	f
92820156-5037-4459-b7b6-8344ffabfd0d	c59cf1ca-1701-476e-8045-584ecac569e4	Comune	b086e936-57e5-46fa-a38e-51108e627e3b	kg	18	f
94610731-af1b-4ecf-bee2-4c37feee8f1d	c59cf1ca-1701-476e-8045-584ecac569e4	Maggiolini	b086e936-57e5-46fa-a38e-51108e627e3b	kg	30	f
041ef8f9-ffc1-441d-920b-168d7f2597fd	c59cf1ca-1701-476e-8045-584ecac569e4	Integrale	0de1bd01-a5eb-43b0-b907-7508f48922f7	kg	16	f
0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	c59cf1ca-1701-476e-8045-584ecac569e4	Romano	b086e936-57e5-46fa-a38e-51108e627e3b	kg	18	f
64f59ccf-be2a-4d15-ab83-94171e69a395	c59cf1ca-1701-476e-8045-584ecac569e4	Ciabattina lunga XD	7c503445-e49c-4edc-bac2-cfba4e888e41	kg	14	f
176307fa-d193-4222-b90e-3e8b342e651e	c59cf1ca-1701-476e-8045-584ecac569e4	Semolino	7c503445-e49c-4edc-bac2-cfba4e888e41	kg	28	f
0da5a062-f5c8-4c88-98af-075e5ab0a509	c59cf1ca-1701-476e-8045-584ecac569e4	Quadrotto	7c503445-e49c-4edc-bac2-cfba4e888e41	kg	15	f
e76dcae7-c72d-4957-9aa7-d627003e5bb2	c59cf1ca-1701-476e-8045-584ecac569e4	Olio	b086e936-57e5-46fa-a38e-51108e627e3b	kg	28	f
4d81bd1c-7f87-443d-b964-ff79508e5ac6	c59cf1ca-1701-476e-8045-584ecac569e4	Lingue	715936a2-2b15-4dcd-bb89-e9eb9cb12142	pieces	\N	f
024d785a-29ce-4e5e-a6c9-c2328efec7de	c59cf1ca-1701-476e-8045-584ecac569e4	Fichi	715936a2-2b15-4dcd-bb89-e9eb9cb12142	pieces	\N	f
56682043-cae8-49d9-b423-694a058f5f73	c59cf1ca-1701-476e-8045-584ecac569e4	Frollini	715936a2-2b15-4dcd-bb89-e9eb9cb12142	pieces	\N	f
3ad5eb00-141e-47bf-9365-27847448344f	c59cf1ca-1701-476e-8045-584ecac569e4	Tegole integrali	715936a2-2b15-4dcd-bb89-e9eb9cb12142	pieces	\N	f
185ec9ab-7b36-458f-b345-7ff7e7f592c4	c59cf1ca-1701-476e-8045-584ecac569e4	Tegole al burro	715936a2-2b15-4dcd-bb89-e9eb9cb12142	pieces	\N	f
29f4db22-9532-489f-9395-4cef20e34357	c59cf1ca-1701-476e-8045-584ecac569e4	Cantucci	715936a2-2b15-4dcd-bb89-e9eb9cb12142	pieces	\N	f
502882f7-10e0-4dd8-99e7-2b85e8f36ad4	c59cf1ca-1701-476e-8045-584ecac569e4	Torcetto al vin bru lè	715936a2-2b15-4dcd-bb89-e9eb9cb12142	pieces	\N	f
a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	c59cf1ca-1701-476e-8045-584ecac569e4	PIZZA	9b52e186-55ff-4764-93c6-baf6d318706b	pieces	\N	f
d6939926-e956-4295-96de-573dff94f2b2	c59cf1ca-1701-476e-8045-584ecac569e4	Ossolano	7323cd80-0277-4018-b8b1-b7fa492e3d53	pieces	\N	f
43620106-1595-430e-b31d-a30a17304cec	c59cf1ca-1701-476e-8045-584ecac569e4	PIZZA CON VERDURA	9b52e186-55ff-4764-93c6-baf6d318706b	pieces	\N	f
03d97c70-204e-4a93-9dc9-a2524e1a1843	c59cf1ca-1701-476e-8045-584ecac569e4	PIZZA CON PROSCIUTTO	9b52e186-55ff-4764-93c6-baf6d318706b	pieces	\N	f
f9008beb-4663-4ceb-bd05-eefff8739259	c59cf1ca-1701-476e-8045-584ecac569e4	PALA	1ebcb358-4dc0-47fd-8a69-b0aca4ed63d1	pieces	\N	f
34a4209c-438e-456b-958c-d26717c67ecb	c59cf1ca-1701-476e-8045-584ecac569e4	PALA PRECOTTA	1ebcb358-4dc0-47fd-8a69-b0aca4ed63d1	pieces	\N	f
e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	c59cf1ca-1701-476e-8045-584ecac569e4	FOCACCIA	a6ff3047-f0c0-4460-b154-fcc75bce65f7	pieces	\N	f
c6dfabb9-0bb9-4e18-b26d-403b7a611852	c59cf1ca-1701-476e-8045-584ecac569e4	FOCACCIA CIPOLLE	a6ff3047-f0c0-4460-b154-fcc75bce65f7	pieces	\N	f
50dcee9f-1c16-49e9-a219-e8c51f1f6636	c59cf1ca-1701-476e-8045-584ecac569e4	Bibanesi normali	39876ee6-f565-4d53-9bc8-ae623218ae55	pieces	\N	f
272ea899-2067-47f2-8d22-9b2e59f2c7b8	c59cf1ca-1701-476e-8045-584ecac569e4	Bibanesi integrali	39876ee6-f565-4d53-9bc8-ae623218ae55	pieces	\N	f
c1304530-08e7-4b99-8f64-89eb3b390243	c59cf1ca-1701-476e-8045-584ecac569e4	Grissini lunghi normali	39876ee6-f565-4d53-9bc8-ae623218ae55	pieces	\N	f
1948eca4-8275-4cf4-a6f8-c82e183f6d4d	c59cf1ca-1701-476e-8045-584ecac569e4	Grissini lunghi sesamo	39876ee6-f565-4d53-9bc8-ae623218ae55	pieces	\N	f
237c2a3a-fbf0-4794-ba16-9c8820092866	c59cf1ca-1701-476e-8045-584ecac569e4	Grissini lunghi rosmarino	39876ee6-f565-4d53-9bc8-ae623218ae55	pieces	\N	f
6028d7d5-1f91-41b3-aef4-5ea94b23cfbe	c59cf1ca-1701-476e-8045-584ecac569e4	Tarallo classico	fa0fe3cc-f061-454b-9ccb-2414ff773744	pieces	\N	f
9d86638f-7953-4501-8848-1b1699e48a18	c59cf1ca-1701-476e-8045-584ecac569e4	Taralli patate e rosmarino	fa0fe3cc-f061-454b-9ccb-2414ff773744	pieces	\N	f
37d66304-d6b6-4261-a065-1be24aeb104b	c59cf1ca-1701-476e-8045-584ecac569e4	Quadrotto bianco ornella	b086e936-57e5-46fa-a38e-51108e627e3b	kg	10	f
4c964f81-b74d-4fe8-a53a-e0491645336b	c59cf1ca-1701-476e-8045-584ecac569e4	Quadrotto semola ornella	7c503445-e49c-4edc-bac2-cfba4e888e41	pieces	\N	f
411ff911-5c57-497e-aef9-580351c88f24	c59cf1ca-1701-476e-8045-584ecac569e4	Arabo	b086e936-57e5-46fa-a38e-51108e627e3b	pieces	\N	f
d4ff9cf3-4e81-4315-90e6-eb602a136a0a	c59cf1ca-1701-476e-8045-584ecac569e4	PIZZA TONDA 0	9b52e186-55ff-4764-93c6-baf6d318706b	pieces	\N	f
8b4a2f78-50b8-4374-a55b-a01b7aea7341	c59cf1ca-1701-476e-8045-584ecac569e4	Curcuma	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
725caca3-1174-4f0e-8374-d00465cc932d	c59cf1ca-1701-476e-8045-584ecac569e4	Pane alle verdure	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
508e5ef7-b9c5-4c7f-b343-34816e0b75c9	c59cf1ca-1701-476e-8045-584ecac569e4	Curcuma e provolone	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	c59cf1ca-1701-476e-8045-584ecac569e4	Cerealini tondi	0de1bd01-a5eb-43b0-b907-7508f48922f7	pieces	\N	f
e4d79a03-d550-440a-84e0-cb87a56de8a3	c59cf1ca-1701-476e-8045-584ecac569e4	Pane alle cipolle	7161eb07-8905-4420-9110-254473ef1a59	pieces	\N	f
00c5ef17-0b3f-463c-bcfc-ed0528bb5020	c59cf1ca-1701-476e-8045-584ecac569e4	PIZZA ACCIUGHE	9b52e186-55ff-4764-93c6-baf6d318706b	pieces	\N	f
5a4efa43-c1c3-4a3f-96b6-748a2eecbec5	c59cf1ca-1701-476e-8045-584ecac569e4	FOCACCIA INTEGRALE	a6ff3047-f0c0-4460-b154-fcc75bce65f7	pieces	\N	f
35963234-2d56-4557-973d-7e57a6646e57	c59cf1ca-1701-476e-8045-584ecac569e4	FOCACCIA POMODORINI	a6ff3047-f0c0-4460-b154-fcc75bce65f7	pieces	\N	f
1eea3318-ff50-409d-8759-9645f3aada40	c59cf1ca-1701-476e-8045-584ecac569e4	FOCACCINE	a6ff3047-f0c0-4460-b154-fcc75bce65f7	pieces	\N	f
1ee13245-65c0-4b20-86cc-39df95635f48	c59cf1ca-1701-476e-8045-584ecac569e4	Pasta	2e39ca0b-f486-4e8a-a6f4-1becd07bfa79	kg	1	f
\.


--
-- Data for Name: recurring_order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recurring_order_items (id, recurring_order_id, product_id, quantity, unit, "position", weekday, removed) FROM stdin;
63849a19-31e3-420a-b7d8-6715956c3b07	4d6552b6-7c4c-456f-b068-26755bad135f	176307fa-d193-4222-b90e-3e8b342e651e	2.00	kg	0	\N	f
4a012d5a-fe21-4dda-8e4f-b46ef3e07442	4d6552b6-7c4c-456f-b068-26755bad135f	0da5a062-f5c8-4c88-98af-075e5ab0a509	1.00	kg	1	\N	f
e97baaaa-d808-4d9e-a5e4-7bf52c283ecc	4d6552b6-7c4c-456f-b068-26755bad135f	6ba8b958-628e-424f-8040-49cfaa00985d	2.00	kg	2	\N	f
787c3241-0ad5-41a8-a229-621889ecef75	4d6552b6-7c4c-456f-b068-26755bad135f	fbc92d53-9184-48c5-8fb6-08eb94762912	4.00	kg	3	\N	f
05ed987d-c0db-494d-af25-62bcae217280	4d6552b6-7c4c-456f-b068-26755bad135f	075c301f-67e2-4bff-bcc8-2d215fcdf849	7.00	kg	4	\N	f
def50166-f341-41c1-b743-7ed2bcea1f27	c4c7bd63-8306-4c56-bc8d-e8d7988351b1	176307fa-d193-4222-b90e-3e8b342e651e	20.00	pieces	0	\N	f
5ab3b00d-fe1f-4661-9a73-4750333f9a16	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	35c51dce-046e-41b8-abf8-df9b318116f7	2.00	pieces	0	\N	f
8a1fa25f-dbb4-4386-81e9-250cfb461723	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	1	\N	f
c860b746-7271-4f89-9b1d-5353649b87eb	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	94610731-af1b-4ecf-bee2-4c37feee8f1d	12.00	pieces	2	\N	f
093cafcd-b840-4245-9682-fd4fe27733c9	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	f4665f7d-81b6-414d-9cb9-b962febfe50b	24.00	pieces	3	\N	f
5f1b748d-08f8-4a78-90f1-4bce7bf738a9	c410243e-e5b1-4c41-b4d5-d091f1a54dd6	041ef8f9-ffc1-441d-920b-168d7f2597fd	6.00	pieces	0	\N	f
51c7abbf-c6b4-4a3f-aeb6-b0624d8c7e76	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	4	\N	f
94bc31d9-178e-4900-9771-ead5877745c8	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.50	kg	5	\N	f
51ef0c2e-ab08-4083-9544-b414424e30c8	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	18222ed3-19a9-44d6-a028-e6fb2068136d	6.00	pieces	6	\N	f
69e13a09-20ba-4226-8174-cf2d0a4c4768	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	0da5a062-f5c8-4c88-98af-075e5ab0a509	4.00	kg	7	\N	f
2bee2350-804b-4d52-8b6d-dbcf24219446	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	8	\N	f
e33b806c-b85f-4327-9b2d-62994f1786d0	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	8.00	pieces	9	\N	f
c78a8100-decd-4cc5-bdc5-bfcb691ba6b0	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	10	\N	f
fb6b46f1-992d-4570-9220-990f0e591430	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	11	\N	f
48d2654e-52d7-474b-a8a8-e4a30c7b25ef	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	620723fb-8ddc-43c6-b1b8-24a471d05dd3	2.00	pieces	12	\N	f
58fd867a-4cf1-4ddb-8e62-151d07e263b7	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	075c301f-67e2-4bff-bcc8-2d215fcdf849	4.00	pieces	13	\N	f
7855a039-5654-4dd8-85fb-8c0ff6f73bba	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	25149783-1d1a-4449-b54a-1068ca3405ba	1.00	pieces	14	\N	f
bb32d459-291a-49ae-9c9a-1dd7a34a4f5e	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	feebdc41-9a89-4de4-8860-6c06c81c002a	1.00	pieces	15	\N	f
d212a8d1-a387-479c-9483-50076d429613	5789d0e6-8edd-414d-b227-6076e0b49adb	176307fa-d193-4222-b90e-3e8b342e651e	12.00	pieces	0	\N	f
6e0f3d5a-2719-41c4-a3ba-8f9a94f6fa30	5789d0e6-8edd-414d-b227-6076e0b49adb	0da5a062-f5c8-4c88-98af-075e5ab0a509	9.00	pieces	0	\N	f
24b9b812-3686-4652-8e16-eaa8abf1e5cf	5789d0e6-8edd-414d-b227-6076e0b49adb	18222ed3-19a9-44d6-a028-e6fb2068136d	1.00	pieces	0	\N	f
64d34442-7993-4588-90a8-2a0d5e9bb709	5789d0e6-8edd-414d-b227-6076e0b49adb	041ef8f9-ffc1-441d-920b-168d7f2597fd	2.00	pieces	0	\N	f
f0fe9bb2-e8f3-47d1-9383-8285893bfa2b	c410243e-e5b1-4c41-b4d5-d091f1a54dd6	e76dcae7-c72d-4957-9aa7-d627003e5bb2	10.00	pieces	0	\N	f
7c380465-f158-4cdc-8171-761971c7ad80	c410243e-e5b1-4c41-b4d5-d091f1a54dd6	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	0	\N	f
a2d1338f-cff7-4804-931b-a46952b0ff2c	c410243e-e5b1-4c41-b4d5-d091f1a54dd6	0da5a062-f5c8-4c88-98af-075e5ab0a509	10.00	pieces	0	\N	f
81216703-1b21-420a-a729-d17e95ed337c	c410243e-e5b1-4c41-b4d5-d091f1a54dd6	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	0	\N	f
cd8724c5-51f1-4c4c-9585-009b1d18c372	c410243e-e5b1-4c41-b4d5-d091f1a54dd6	18222ed3-19a9-44d6-a028-e6fb2068136d	2.00	pieces	0	\N	f
f7bdcef1-b895-4d28-af02-58ef450c4050	c410243e-e5b1-4c41-b4d5-d091f1a54dd6	0da5a062-f5c8-4c88-98af-075e5ab0a509	10.00	pieces	0	\N	f
262302f2-0775-4fd3-93d5-14b3a52f401c	c410243e-e5b1-4c41-b4d5-d091f1a54dd6	92820156-5037-4459-b7b6-8344ffabfd0d	1.50	kg	0	\N	f
068a1740-f705-4a95-88ef-7e15cfb1dc80	c410243e-e5b1-4c41-b4d5-d091f1a54dd6	176307fa-d193-4222-b90e-3e8b342e651e	1.50	kg	0	\N	f
2e03c4da-e130-4979-bd46-59db4b78a08e	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	5.00	pieces	0	\N	f
097c90a0-2916-4e5a-ad56-27823059c5c6	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	620723fb-8ddc-43c6-b1b8-24a471d05dd3	6.00	pieces	1	\N	f
d08bd58e-23ac-422f-94c8-3d06638f2c1b	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	970e4480-02e3-4088-b77a-8a0e74c85886	2.00	pieces	2	\N	f
a8e0876c-f384-4dbc-9ad7-cd28fb3eee69	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	35c51dce-046e-41b8-abf8-df9b318116f7	6.00	pieces	3	\N	f
c8d3797e-d5cd-4ad6-9b38-8e57722de0a9	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	4	\N	f
23bcc7eb-1554-4626-92c6-440b0c5c4dc5	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	e76dcae7-c72d-4957-9aa7-d627003e5bb2	0.50	kg	5	\N	f
b54cfe16-4c80-4809-ba59-67f33e49ef79	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	6	\N	f
b4ba5f1b-c003-4635-8a9b-b43c1dc7cd72	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	041ef8f9-ffc1-441d-920b-168d7f2597fd	3.00	kg	7	\N	f
0cb37555-4960-4df9-8ad6-c7891b0b437a	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	0da5a062-f5c8-4c88-98af-075e5ab0a509	2.00	kg	8	\N	f
f87cb4a5-a617-4e4f-aeaf-3aa5dc9813c4	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	176307fa-d193-4222-b90e-3e8b342e651e	1.00	kg	9	\N	f
dff2b5b2-7c85-4b36-8b58-1dd7a1f0cb75	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	10	\N	f
d0ff7cb8-cfe5-433d-bd50-a2d1704a138f	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	4e3e47a9-131c-4351-ac41-1bafd8c657ce	6.00	pieces	11	\N	f
b8b5b727-c5cc-4ae1-babf-faed288a00af	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	7c5ce30a-c741-40c6-81b6-bd846f705efd	4.00	pieces	12	\N	f
86456142-b7a2-46da-811e-b9d61877ef5e	a2322f12-b0ce-45ef-af63-2dd84a24d1c2	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	4.00	pieces	13	\N	f
71db6af3-8b7d-4fcd-86ed-0b4ff1ecb4e7	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	4.00	pieces	16	\N	f
320ede06-77b6-4071-8bab-b591d1f3b482	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	fbc92d53-9184-48c5-8fb6-08eb94762912	1.00	pieces	17	\N	f
b9dd9483-6e51-4017-8c84-c1bd6accae4c	3e06ed16-c79e-4dd3-a0f1-26cd49f38e5b	25149783-1d1a-4449-b54a-1068ca3405ba	2.00	pieces	0	\N	f
0c0f724b-4ea6-44e4-ba30-804aba2e950b	2f513ebe-397d-4915-aa7f-02a56ebd8db4	075c301f-67e2-4bff-bcc8-2d215fcdf849	2.00	pieces	0	\N	f
cb120d24-46cc-451a-80c4-00ee8b783461	2f513ebe-397d-4915-aa7f-02a56ebd8db4	8b4a2f78-50b8-4374-a55b-a01b7aea7341	1.00	pieces	1	\N	f
3e6a800a-867f-4a6d-8ddd-a14069cd80f7	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	92820156-5037-4459-b7b6-8344ffabfd0d	2.00	kg	0	\N	f
b1dea473-6a5a-4dec-a87c-d46c382ef6de	4fc73065-4d50-4f43-ba46-d2498537e6fc	176307fa-d193-4222-b90e-3e8b342e651e	2.50	kg	0	\N	f
e704389a-8969-499d-b8a6-a3906fb6c3cf	36d1b575-8f05-421b-976b-490309d7362b	18222ed3-19a9-44d6-a028-e6fb2068136d	3.00	pieces	0	\N	f
9645e2a4-7cea-4407-b8e5-0445cf6627e2	36d1b575-8f05-421b-976b-490309d7362b	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	3.00	pieces	0	\N	f
fd92dbd4-cb36-4bf3-9a2f-618f2eb8ca37	36d1b575-8f05-421b-976b-490309d7362b	176307fa-d193-4222-b90e-3e8b342e651e	15.00	pieces	0	\N	f
bb5e90eb-22c8-4988-bcb4-2013b5e27c8e	58e24b2a-0582-4788-a641-ce215027ac6b	176307fa-d193-4222-b90e-3e8b342e651e	30.00	pieces	0	\N	f
34c27159-01ff-4472-bb5c-013510081bd3	58e24b2a-0582-4788-a641-ce215027ac6b	18222ed3-19a9-44d6-a028-e6fb2068136d	6.00	pieces	0	\N	f
903f972e-52c3-4ca4-a47c-becffe9be817	58e24b2a-0582-4788-a641-ce215027ac6b	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	6.00	pieces	0	\N	f
cebb2b87-b3db-4cd7-8461-af18f1f466b8	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	f4665f7d-81b6-414d-9cb9-b962febfe50b	20.00	pieces	1	\N	f
546a2297-fafc-4e72-b769-51e784fbc594	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	64f59ccf-be2a-4d15-ab83-94171e69a395	1.50	kg	2	\N	f
46272cab-3810-40ee-882f-e22625074993	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.00	kg	3	\N	f
bea0e04f-cf25-45c4-9775-0eb6fbe61832	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	6ba8b958-628e-424f-8040-49cfaa00985d	0.50	kg	4	\N	f
3af87ab9-84e9-4a7d-a35f-defa74372411	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	18222ed3-19a9-44d6-a028-e6fb2068136d	4.00	pieces	5	\N	f
0e1d9fd7-3f58-4d74-9814-dc144741ba31	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	35c51dce-046e-41b8-abf8-df9b318116f7	3.00	pieces	6	\N	f
b7cf30b2-f3d2-4cdf-a890-f25d9e99efd1	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	7	\N	f
41f1c710-61b6-4bfb-86bd-d4fc488a9e42	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	176307fa-d193-4222-b90e-3e8b342e651e	50.00	pieces	8	\N	f
70f15b0f-ec56-4620-bac5-88426e932095	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	4bfabd30-1486-4ec4-a019-6d61f4d72086	5.00	pieces	9	\N	f
54f260b5-d01e-466e-9d04-dfbde4343364	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	10	\N	f
91e3897c-062e-4d2a-b434-bab2924e28cd	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	11	\N	f
4afab32a-71d2-41b7-ac15-a3ebbc34944f	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	075c301f-67e2-4bff-bcc8-2d215fcdf849	2.00	pieces	12	\N	f
103635ea-ee62-41a1-bdda-27b39b6cc7c6	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	1ee6ce11-fb15-44da-878a-267cbdd0b03a	2.00	pieces	13	\N	f
32f4b524-1ffb-4ad8-ad45-017cb0332d56	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	18	\N	f
9231ea11-698f-4e02-ba93-7e2d925a24cf	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	2.00	pieces	19	\N	f
353ebeaa-a26b-4e6c-a922-cf59c6434dda	77a754fc-a73d-4924-9fb2-cf3fe3d258f2	34e7679d-b1d8-40b2-8359-be4a30e1a981	2.00	pieces	20	\N	f
a6155058-3282-42c6-807c-e3b744e8351c	468f8ec2-bd65-48fd-b5ff-7d51e741930c	8480b77a-07cd-4b5d-8769-2af7e717b684	8.00	pieces	0	\N	f
bb792473-8e44-42e9-962b-c68042cd98c8	468f8ec2-bd65-48fd-b5ff-7d51e741930c	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	3.00	pieces	1	\N	f
96f9ead5-c69f-4b12-8d6c-1755c3e772d0	468f8ec2-bd65-48fd-b5ff-7d51e741930c	620723fb-8ddc-43c6-b1b8-24a471d05dd3	8.00	pieces	2	\N	f
0bfde61c-805d-471e-b71e-a828c9887394	fa572801-0db3-4345-a5cb-edf273d2a50f	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	0	\N	f
20670dfa-d0d8-4738-9edf-2565bf45703d	fa572801-0db3-4345-a5cb-edf273d2a50f	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	1	\N	f
0801cafa-a882-44f8-8efa-8dae6f2ff6df	fa572801-0db3-4345-a5cb-edf273d2a50f	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	2	\N	f
3131bfb0-d800-4751-b387-64f091ceadb3	fa572801-0db3-4345-a5cb-edf273d2a50f	0da5a062-f5c8-4c88-98af-075e5ab0a509	5.00	pieces	3	\N	f
0ed7928f-2118-4034-b2b1-4cee3f32dffb	fa572801-0db3-4345-a5cb-edf273d2a50f	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2.00	pieces	4	\N	f
73e29236-75f3-4838-8896-c3aa447d8e50	fa572801-0db3-4345-a5cb-edf273d2a50f	041ef8f9-ffc1-441d-920b-168d7f2597fd	2.00	pieces	5	\N	f
68ba5418-52cc-4e1d-a485-66b3b0a37ed6	fa572801-0db3-4345-a5cb-edf273d2a50f	176307fa-d193-4222-b90e-3e8b342e651e	8.00	pieces	6	\N	f
62dffb3e-ee44-45ca-88ef-a82e5c790b9a	d89f724c-5d92-4f0d-b95d-0f95bb06321a	8480b77a-07cd-4b5d-8769-2af7e717b684	10.00	pieces	0	\N	f
fe11bb8e-69d3-40b4-a1db-016ada6e1745	d89f724c-5d92-4f0d-b95d-0f95bb06321a	075c301f-67e2-4bff-bcc8-2d215fcdf849	6.00	pieces	1	\N	f
a20585b1-7444-4802-9f28-bf5428c44cca	d89f724c-5d92-4f0d-b95d-0f95bb06321a	973d147d-0217-41bf-bec2-ab39f80af20c	8.00	pieces	2	\N	f
b84e2b19-ca2a-4af7-badf-bd9d0107c47d	d89f724c-5d92-4f0d-b95d-0f95bb06321a	feebdc41-9a89-4de4-8860-6c06c81c002a	6.00	pieces	3	\N	f
d3da4d31-fe24-471a-b464-61b8c4af4b3d	468f8ec2-bd65-48fd-b5ff-7d51e741930c	74545d89-0336-41f8-b100-6b1a2c8cf381	4.00	pieces	3	\N	f
a756da2b-24f4-45e8-bead-c89ec3946a44	468f8ec2-bd65-48fd-b5ff-7d51e741930c	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	4	\N	f
ee579c7f-9c87-434a-b03e-8ddfcea1d82b	468f8ec2-bd65-48fd-b5ff-7d51e741930c	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	5	\N	f
f8b1e08c-6bf1-466e-b629-4e404d289a2f	468f8ec2-bd65-48fd-b5ff-7d51e741930c	041ef8f9-ffc1-441d-920b-168d7f2597fd	10.00	pieces	6	\N	f
ef3537b9-e2d3-4bcb-92d4-b39f7678b2b6	468f8ec2-bd65-48fd-b5ff-7d51e741930c	176307fa-d193-4222-b90e-3e8b342e651e	2.00	kg	7	\N	f
207332c4-ff80-4117-8534-a9eaf2b18d2c	468f8ec2-bd65-48fd-b5ff-7d51e741930c	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	8	\N	f
dde554d5-049a-4d7f-9361-59fc52966f5d	468f8ec2-bd65-48fd-b5ff-7d51e741930c	64f59ccf-be2a-4d15-ab83-94171e69a395	14.00	pieces	9	\N	f
2cc4631c-fad3-4a51-bdec-6e532f9c4ec0	468f8ec2-bd65-48fd-b5ff-7d51e741930c	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	10	\N	f
5e7af534-a5d5-46ce-aca0-328c28e5f307	468f8ec2-bd65-48fd-b5ff-7d51e741930c	43620106-1595-430e-b31d-a30a17304cec	0.50	pieces	11	\N	f
8b2b5a15-fe6a-412e-9fb9-812745c40a22	468f8ec2-bd65-48fd-b5ff-7d51e741930c	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.00	pieces	12	\N	f
551ce188-ba1f-4562-b29c-91a6ad9c0f5c	468f8ec2-bd65-48fd-b5ff-7d51e741930c	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	13	\N	f
48626a91-c061-47d2-adef-c75bbc30a059	468f8ec2-bd65-48fd-b5ff-7d51e741930c	7c5ce30a-c741-40c6-81b6-bd846f705efd	1.00	pieces	14	\N	f
b57e5c35-0815-4b7b-bcca-5dc7cb3aa801	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	973d147d-0217-41bf-bec2-ab39f80af20c	1.00	pieces	14	\N	f
c9a85911-d83e-4fac-9928-a74427cff3ed	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	25149783-1d1a-4449-b54a-1068ca3405ba	2.00	pieces	15	\N	f
a3ddb9a1-635f-45b2-9cf1-1fbd7a0c9604	a9bd0635-13b5-4ae3-aa31-c2c80dedb277	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	16	\N	f
217dcf87-bd13-4e32-9698-dfaa20a7f99d	13775ff6-6eca-4a1c-a9a5-f5e35709e12f	7c5ce30a-c741-40c6-81b6-bd846f705efd	35.00	pieces	0	\N	f
7edf30bf-1f82-48fc-8844-4fcc9b872ce5	13775ff6-6eca-4a1c-a9a5-f5e35709e12f	34e7679d-b1d8-40b2-8359-be4a30e1a981	15.00	pieces	1	\N	f
9662d6fd-ba81-4120-99fd-ce93b8dfc072	ec83870f-f756-443e-9477-2c2bfaa4341a	4e3e47a9-131c-4351-ac41-1bafd8c657ce	2.00	pieces	0	\N	f
7d883a54-29e3-43e9-860b-07efb709e547	ec83870f-f756-443e-9477-2c2bfaa4341a	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	1	\N	f
2fa65882-b567-44d5-8ec5-4536489ebf77	a5e8d2e4-4e34-4a1e-9907-83d104477c7a	4e3e47a9-131c-4351-ac41-1bafd8c657ce	5.00	pieces	0	\N	f
62592df7-b778-412f-91da-9a61a6a68fae	a5e8d2e4-4e34-4a1e-9907-83d104477c7a	7c5ce30a-c741-40c6-81b6-bd846f705efd	3.00	pieces	1	\N	f
87c59941-0be1-4cc9-92a0-dc9d6c3ef321	a5e8d2e4-4e34-4a1e-9907-83d104477c7a	34e7679d-b1d8-40b2-8359-be4a30e1a981	3.00	pieces	2	\N	f
0c6dd3f5-05a1-4528-8961-cb8835354a0f	84f8057e-d548-4918-b4fc-47a4cf154b00	92820156-5037-4459-b7b6-8344ffabfd0d	36.00	pieces	0	\N	f
a61ff480-fd0f-4167-b8ff-861ae25b34fe	84f8057e-d548-4918-b4fc-47a4cf154b00	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	1	\N	f
12345b1c-9e8d-4f01-86c7-d41e2dcf0bcd	84f8057e-d548-4918-b4fc-47a4cf154b00	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	2.00	pieces	2	\N	f
54e792cd-8296-4522-a5bd-be00924ab0d7	84f8057e-d548-4918-b4fc-47a4cf154b00	0da5a062-f5c8-4c88-98af-075e5ab0a509	5.00	pieces	3	\N	f
3c97a170-cb95-451d-a4c6-b0352e14da7f	84f8057e-d548-4918-b4fc-47a4cf154b00	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	4	\N	f
1addd7c0-97f5-4e8e-9a0e-b37ac2475c3e	84f8057e-d548-4918-b4fc-47a4cf154b00	041ef8f9-ffc1-441d-920b-168d7f2597fd	11.00	pieces	5	\N	f
6a9ef2b0-d1d3-4784-81b6-2a6bcaf70dd8	84f8057e-d548-4918-b4fc-47a4cf154b00	64f59ccf-be2a-4d15-ab83-94171e69a395	10.00	pieces	6	\N	f
4b5e7458-68c0-431b-9b7f-c0d23acc89d8	84f8057e-d548-4918-b4fc-47a4cf154b00	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	7	\N	f
01dfae0f-347a-4037-a03f-84e38d6b0d0b	84f8057e-d548-4918-b4fc-47a4cf154b00	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	8	\N	f
fbb3c70d-8a72-49c5-9661-d4ef3e395bdd	84f8057e-d548-4918-b4fc-47a4cf154b00	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	9	\N	f
528e09cc-84d9-4e67-8c4a-1001cf87c2e2	84f8057e-d548-4918-b4fc-47a4cf154b00	35c51dce-046e-41b8-abf8-df9b318116f7	2.00	pieces	10	\N	f
9b40bf6b-724e-4d4b-b8bb-1634cc3ed1f2	ed432b8b-2be7-4b8b-964c-4d2d56be2e9e	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	0	\N	f
79c4e264-7fd1-4617-87cb-d97b77a04ffe	ed432b8b-2be7-4b8b-964c-4d2d56be2e9e	973d147d-0217-41bf-bec2-ab39f80af20c	3.00	pieces	0	\N	f
2fa8d7b0-c664-4606-b656-c42b2ba8e99e	ed432b8b-2be7-4b8b-964c-4d2d56be2e9e	075c301f-67e2-4bff-bcc8-2d215fcdf849	6.00	pieces	0	\N	f
58cd9b92-3ae7-4d1e-a89f-52b96d0e7b0d	ed432b8b-2be7-4b8b-964c-4d2d56be2e9e	0da5a062-f5c8-4c88-98af-075e5ab0a509	3.50	kg	0	\N	f
bb6ca36e-dbc5-4451-94f5-9856db0e5d11	ed432b8b-2be7-4b8b-964c-4d2d56be2e9e	6ba8b958-628e-424f-8040-49cfaa00985d	1.00	kg	0	\N	f
9530712b-166d-4136-b959-a93a8c3f1d1a	ed432b8b-2be7-4b8b-964c-4d2d56be2e9e	176307fa-d193-4222-b90e-3e8b342e651e	3.50	kg	0	\N	f
1379d9af-c9e5-4839-a420-abc2ded7aa1e	ed432b8b-2be7-4b8b-964c-4d2d56be2e9e	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	0	\N	f
3d3166d8-e51c-48b5-bfd8-543c23ecd8be	ed432b8b-2be7-4b8b-964c-4d2d56be2e9e	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.00	kg	0	\N	f
ccc0dfef-1c82-4c1b-994c-69b672e1d662	84f8057e-d548-4918-b4fc-47a4cf154b00	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	10.00	pieces	11	\N	f
94df59f3-fc89-49bb-8264-ec688819209e	84f8057e-d548-4918-b4fc-47a4cf154b00	7c5ce30a-c741-40c6-81b6-bd846f705efd	10.00	pieces	12	\N	f
ac380059-dd17-4df4-9599-c3b585ddaea2	84f8057e-d548-4918-b4fc-47a4cf154b00	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	13	\N	f
7a4b191a-d9f8-4edc-9696-4c4632a469e0	58179021-c117-4ee6-9838-7d4891892d40	92820156-5037-4459-b7b6-8344ffabfd0d	36.00	pieces	0	\N	f
c43795a3-e60e-4876-862d-87d8fda869a5	58179021-c117-4ee6-9838-7d4891892d40	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	1	\N	f
4a612185-f968-4f56-b24f-33a3da8e702c	2b551728-e33b-4387-81e1-ed231f1d74df	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	4.00	pieces	0	\N	f
a5e36dec-e41b-4fb4-a862-2f630b07f916	68557438-0912-4f64-bab4-2e807a2d0182	973d147d-0217-41bf-bec2-ab39f80af20c	1.00	pieces	0	\N	f
f81edbef-33a5-46bb-8d20-3099cd88d28c	68557438-0912-4f64-bab4-2e807a2d0182	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	1	\N	f
b8c7a5a4-490a-4fae-838f-b20a31af2179	68557438-0912-4f64-bab4-2e807a2d0182	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	2	\N	f
efc98159-9c03-44f1-8272-99c7b6c30947	68557438-0912-4f64-bab4-2e807a2d0182	0da5a062-f5c8-4c88-98af-075e5ab0a509	10.00	pieces	3	\N	f
57f609f4-ac87-4cbc-a0b9-308c21c1f9e4	d44e7f25-c5fb-4a39-95b8-733973dc3e9a	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	0	\N	f
59dc46dd-7a3f-469a-920e-8032c681d443	d44e7f25-c5fb-4a39-95b8-733973dc3e9a	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	1	\N	f
8cead3ad-8396-4eaf-8a3d-f595eef77824	d44e7f25-c5fb-4a39-95b8-733973dc3e9a	0da5a062-f5c8-4c88-98af-075e5ab0a509	10.00	pieces	2	\N	f
6ca4f46b-5b41-4908-be04-e65e1c673c84	d44e7f25-c5fb-4a39-95b8-733973dc3e9a	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	3	\N	f
f05a22fc-c08d-4e9c-b3e4-5b9ddf414079	4f50bafa-b5dc-4e4d-a151-93cb945133b7	176307fa-d193-4222-b90e-3e8b342e651e	1.00	kg	0	\N	f
6539ff80-d49c-43dc-b07f-88a3fb83c81a	4f50bafa-b5dc-4e4d-a151-93cb945133b7	0da5a062-f5c8-4c88-98af-075e5ab0a509	1.00	kg	1	\N	f
d094ad7e-ceb7-4af9-9329-73cd21f5d916	d368ae04-4e30-4591-ba84-afa005712b4e	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	0	\N	f
c3f3c9eb-a518-44e9-abe2-0561df3f0c08	d368ae04-4e30-4591-ba84-afa005712b4e	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	0	\N	f
7bb896e3-0ec5-4ae4-bec7-0266b8f230df	d368ae04-4e30-4591-ba84-afa005712b4e	176307fa-d193-4222-b90e-3e8b342e651e	0.50	kg	0	\N	f
6a93584c-e3bf-4cd2-bda0-61a743ef8855	d368ae04-4e30-4591-ba84-afa005712b4e	6ba8b958-628e-424f-8040-49cfaa00985d	0.50	kg	0	\N	f
58ef5014-beaa-4608-9a9b-2a5c71dc6470	d368ae04-4e30-4591-ba84-afa005712b4e	0da5a062-f5c8-4c88-98af-075e5ab0a509	0.50	kg	0	\N	f
090f145b-6a80-481c-a77a-adfbc3815352	d368ae04-4e30-4591-ba84-afa005712b4e	92820156-5037-4459-b7b6-8344ffabfd0d	0.50	kg	0	\N	f
9cbb7b15-4c0b-41b3-8f29-e7b1218ecc8b	d368ae04-4e30-4591-ba84-afa005712b4e	041ef8f9-ffc1-441d-920b-168d7f2597fd	0.50	kg	0	\N	f
97049a8b-80d2-48a8-8465-957c8ff350a3	d368ae04-4e30-4591-ba84-afa005712b4e	37d66304-d6b6-4261-a065-1be24aeb104b	1.50	kg	0	\N	f
85920480-cfd5-4b4e-a572-ad2e956b9553	2b551728-e33b-4387-81e1-ed231f1d74df	6ba8b958-628e-424f-8040-49cfaa00985d	5.00	pieces	1	\N	f
c2463e8c-ee5e-460a-9492-fd5405abc092	2b551728-e33b-4387-81e1-ed231f1d74df	973d147d-0217-41bf-bec2-ab39f80af20c	1.00	pieces	2	\N	f
e9a97f60-5e5b-4d64-a2a1-b1c6b22b3298	744138a0-6914-482c-ba2f-87daea0715dd	970e4480-02e3-4088-b77a-8a0e74c85886	4.00	pieces	0	\N	f
7e2281ca-7cfe-4c5e-8e29-24b6eb8e623b	744138a0-6914-482c-ba2f-87daea0715dd	075c301f-67e2-4bff-bcc8-2d215fcdf849	4.00	pieces	1	\N	f
89b26000-2924-4fad-b99a-003f3daec249	744138a0-6914-482c-ba2f-87daea0715dd	041ef8f9-ffc1-441d-920b-168d7f2597fd	15.00	pieces	2	\N	f
7b8201a1-bf09-4865-9ebd-e0f4f5dc44c7	27e8ba74-6926-40c8-8a9f-ebca597c27d1	8b4a2f78-50b8-4374-a55b-a01b7aea7341	3.00	pieces	0	\N	f
20e61e4e-5c5c-4b89-a5fb-ab04def06f68	27e8ba74-6926-40c8-8a9f-ebca597c27d1	725caca3-1174-4f0e-8374-d00465cc932d	3.00	pieces	1	\N	f
93864408-155b-4794-ba3c-858116425120	27e8ba74-6926-40c8-8a9f-ebca597c27d1	25149783-1d1a-4449-b54a-1068ca3405ba	3.00	pieces	2	\N	f
1ea98abf-5c41-4547-87c0-ddbaf9573747	27e8ba74-6926-40c8-8a9f-ebca597c27d1	075c301f-67e2-4bff-bcc8-2d215fcdf849	3.00	pieces	3	\N	f
7a2a49b7-85b9-463b-9373-27c9a80b1972	fc3f2ff8-490b-4f9e-808f-6f77495c1731	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	0	\N	f
21d01783-493a-47e7-b5fe-1c49467e6897	fc3f2ff8-490b-4f9e-808f-6f77495c1731	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	0	\N	f
d20b494e-9e01-4c23-9b6b-f6fdc45b3552	fc3f2ff8-490b-4f9e-808f-6f77495c1731	075c301f-67e2-4bff-bcc8-2d215fcdf849	1.00	pieces	0	\N	f
56a3b524-2e67-4afb-afdc-912035ffbc4c	3b4e8297-9c54-4b7d-982d-ef92ebd403e3	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	0	\N	f
6ba09037-94c2-47ac-839d-98953d265eca	3b4e8297-9c54-4b7d-982d-ef92ebd403e3	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	0	\N	f
81185c5c-a9e4-4228-849b-edfc1e8e90a4	d39de284-5ec1-43d7-8004-f288e9cabe94	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	4.00	pieces	0	\N	f
d4ade012-3b35-4321-b5e3-ffd2187a83dd	d39de284-5ec1-43d7-8004-f288e9cabe94	075c301f-67e2-4bff-bcc8-2d215fcdf849	4.00	pieces	0	\N	f
6a1f7951-04b1-40e3-a9f4-af067bb1f0ef	d39de284-5ec1-43d7-8004-f288e9cabe94	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	4.00	pieces	0	\N	f
5892bede-aadb-4a83-89da-a7d13ab6226d	3ab5eede-d096-4d2f-8b7a-9262a9a31a77	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	0	\N	f
dd55c947-f7ac-4ea8-860e-e84e52dedd6a	3ab5eede-d096-4d2f-8b7a-9262a9a31a77	f4665f7d-81b6-414d-9cb9-b962febfe50b	15.00	pieces	0	\N	f
45328258-bcd6-425c-96d4-882340103e58	3ab5eede-d096-4d2f-8b7a-9262a9a31a77	35c51dce-046e-41b8-abf8-df9b318116f7	1.00	pieces	0	\N	f
e234f5cc-f7a7-4e67-9565-964ef1da3d7d	3ab5eede-d096-4d2f-8b7a-9262a9a31a77	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2.00	pieces	0	\N	f
a18559fb-3024-4b48-a6ea-632c7bdb7ec7	3ab5eede-d096-4d2f-8b7a-9262a9a31a77	041ef8f9-ffc1-441d-920b-168d7f2597fd	9.00	pieces	0	\N	f
d2e48fa4-5381-4f40-8640-643ba196631f	3ab5eede-d096-4d2f-8b7a-9262a9a31a77	6ba8b958-628e-424f-8040-49cfaa00985d	5.00	pieces	0	\N	f
c09d3878-7f91-45b3-8ec6-a593d8e5e9cf	45303d29-9305-442f-aaad-0b3469cb14c4	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	0	\N	f
6560c5c5-b2b5-448f-9ec1-24c29a31bdd5	45303d29-9305-442f-aaad-0b3469cb14c4	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	0	\N	f
9338fecd-377a-458e-a798-2ac969e78e40	45303d29-9305-442f-aaad-0b3469cb14c4	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	4.00	pieces	0	\N	f
7f1be7e8-db76-4833-ba91-3c13e5b7b1e3	45303d29-9305-442f-aaad-0b3469cb14c4	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	0	\N	f
083b9360-a472-406a-be0d-3275510b6d94	45303d29-9305-442f-aaad-0b3469cb14c4	92820156-5037-4459-b7b6-8344ffabfd0d	25.00	pieces	0	\N	f
7414add4-80b4-4dec-84d6-6543733652ba	9e39141a-4f8a-4ec1-b797-8652e73629dd	176307fa-d193-4222-b90e-3e8b342e651e	150.00	pieces	0	\N	f
de91ebce-2d8e-4651-b7a5-cd1d89250254	9e39141a-4f8a-4ec1-b797-8652e73629dd	37d66304-d6b6-4261-a065-1be24aeb104b	35.00	pieces	1	\N	f
f70aec6e-1298-46e7-83e5-51926e710aea	9e39141a-4f8a-4ec1-b797-8652e73629dd	4c964f81-b74d-4fe8-a53a-e0491645336b	20.00	pieces	2	\N	f
93962a62-452c-46b3-ba55-d86c357c765a	27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	0da5a062-f5c8-4c88-98af-075e5ab0a509	6.00	kg	0	\N	f
14641049-f2ca-470a-b064-273a16bd6395	27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	1	\N	f
6b5a210e-0466-488b-a7c0-bd83d3ca829f	27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	041ef8f9-ffc1-441d-920b-168d7f2597fd	2.00	kg	2	\N	f
7cb61234-b91f-4330-84ec-3637872055f4	27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	92820156-5037-4459-b7b6-8344ffabfd0d	2.50	kg	3	\N	f
9df33991-c90a-4ce9-b9fe-01575531a372	27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	4.00	pieces	4	\N	f
940b8a40-b100-4afa-894c-7a5e004ea6f2	26164861-f5e0-4721-82e9-beaee984dbbe	35c51dce-046e-41b8-abf8-df9b318116f7	1.00	pieces	0	\N	f
8acdfe1f-db87-46fa-b7be-dad7e74845b7	26164861-f5e0-4721-82e9-beaee984dbbe	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	1.00	pieces	0	\N	f
57a275c1-e999-4c3d-8a1e-e9da4ee6e931	26164861-f5e0-4721-82e9-beaee984dbbe	92820156-5037-4459-b7b6-8344ffabfd0d	12.00	pieces	0	\N	f
94700977-fcf1-4dcf-8899-96d16fd7db0a	27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	18222ed3-19a9-44d6-a028-e6fb2068136d	3.00	pieces	5	\N	f
20eeff9c-18a3-404c-83b1-22dc87dd494a	27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	6	\N	f
f3cb97ae-2580-4448-bc90-4889b25915c5	27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	7	\N	f
e28fdaed-6188-4110-8871-9e3a554e45bc	27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	973d147d-0217-41bf-bec2-ab39f80af20c	2.00	pieces	8	\N	f
aff5cf88-7221-4d8b-b7d7-bf4bc26d2989	daa9665a-5802-492a-81d2-ed90a75638e4	0da5a062-f5c8-4c88-98af-075e5ab0a509	6.00	kg	0	\N	f
1100cda0-65e4-4307-b7eb-b47b5a18b678	daa9665a-5802-492a-81d2-ed90a75638e4	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	1	\N	f
7d2c1c0e-2a5f-4151-bc2a-c71aef3208da	daa9665a-5802-492a-81d2-ed90a75638e4	041ef8f9-ffc1-441d-920b-168d7f2597fd	2.00	kg	2	\N	f
8e4e335b-949b-4ed9-9cf8-79aada47ce7e	daa9665a-5802-492a-81d2-ed90a75638e4	92820156-5037-4459-b7b6-8344ffabfd0d	2.50	kg	3	\N	f
a50428c5-cfc5-4f88-a3d8-df6b7442278f	daa9665a-5802-492a-81d2-ed90a75638e4	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	4.00	pieces	4	\N	f
f0fadcac-ebd5-48dd-a02e-c9ce504a0e20	daa9665a-5802-492a-81d2-ed90a75638e4	18222ed3-19a9-44d6-a028-e6fb2068136d	3.00	pieces	5	\N	f
77aa4af5-9dfc-4e52-958b-937f77ebb923	daa9665a-5802-492a-81d2-ed90a75638e4	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	6	\N	f
9fe82a03-8e8e-45db-b472-e9f2306b44b6	daa9665a-5802-492a-81d2-ed90a75638e4	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	7	\N	f
28552221-360f-44a8-9673-56e22de576ec	9e39141a-4f8a-4ec1-b797-8652e73629dd	e76dcae7-c72d-4957-9aa7-d627003e5bb2	10.00	pieces	3	\N	f
63990696-2519-4d30-afb2-373218f17500	9e39141a-4f8a-4ec1-b797-8652e73629dd	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	4	\N	f
f6280dda-b611-4e3f-b259-2d2b3033939c	9e39141a-4f8a-4ec1-b797-8652e73629dd	041ef8f9-ffc1-441d-920b-168d7f2597fd	46.00	pieces	5	\N	f
8787e684-0459-4c8e-afa1-766228e99698	26164861-f5e0-4721-82e9-beaee984dbbe	041ef8f9-ffc1-441d-920b-168d7f2597fd	5.00	pieces	0	\N	f
e3dbd264-8ac3-4af0-b1f9-6854e30dbd0a	26164861-f5e0-4721-82e9-beaee984dbbe	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	2.00	pieces	0	\N	f
d01334c2-cf6c-4fdc-bd40-e8ec02241b13	344a93dc-7dcb-4b6c-8d21-57021cd0ca8c	35c51dce-046e-41b8-abf8-df9b318116f7	1.00	pieces	0	\N	f
c8c50c09-3cc3-46ff-a2a9-120d35012c06	344a93dc-7dcb-4b6c-8d21-57021cd0ca8c	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	1.00	pieces	0	\N	f
49a66a21-4b84-4e3f-9c77-60831b3c278d	344a93dc-7dcb-4b6c-8d21-57021cd0ca8c	92820156-5037-4459-b7b6-8344ffabfd0d	12.00	pieces	0	\N	f
5fa89042-7f82-4e13-a6ff-4e7b5a10a5ec	344a93dc-7dcb-4b6c-8d21-57021cd0ca8c	041ef8f9-ffc1-441d-920b-168d7f2597fd	5.00	pieces	0	\N	f
6e6a6db3-3792-4291-8549-0f32ffe22b3e	344a93dc-7dcb-4b6c-8d21-57021cd0ca8c	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	2.00	pieces	0	\N	f
6ea83373-6fa0-4cb2-9347-ce6663242569	344a93dc-7dcb-4b6c-8d21-57021cd0ca8c	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	0	\N	f
64561e15-16f2-4b81-897d-f7801cd7e8c0	a433b723-cbb4-4523-8b53-df1ee16e3f42	075c301f-67e2-4bff-bcc8-2d215fcdf849	8.00	pieces	0	\N	f
2df1c9b2-b5d9-4c2f-abc2-cb7bb4f10b78	a433b723-cbb4-4523-8b53-df1ee16e3f42	18222ed3-19a9-44d6-a028-e6fb2068136d	10.00	pieces	1	\N	f
5a8168b3-d5cf-43ed-96c1-833d431d80df	a433b723-cbb4-4523-8b53-df1ee16e3f42	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	8.00	pieces	2	\N	f
eb201513-7884-4d4c-9b63-c97b43fce02a	a433b723-cbb4-4523-8b53-df1ee16e3f42	74545d89-0336-41f8-b100-6b1a2c8cf381	4.00	pieces	3	\N	f
85f09ee9-5c0b-4a7c-93c2-df301811f92f	a433b723-cbb4-4523-8b53-df1ee16e3f42	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	4	\N	f
a159e566-abce-45dd-b481-451671466738	a433b723-cbb4-4523-8b53-df1ee16e3f42	4e3e47a9-131c-4351-ac41-1bafd8c657ce	6.00	pieces	5	\N	f
c36d7a84-fdb5-4b76-aac8-809c90aa779c	a433b723-cbb4-4523-8b53-df1ee16e3f42	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	6.00	pieces	6	\N	f
cc597677-abe9-42eb-b7cf-28641b9edc92	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	041ef8f9-ffc1-441d-920b-168d7f2597fd	30.00	pieces	0	\N	f
d0a60ecd-80c7-4402-a763-6756804da2ef	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	20.00	pieces	1	\N	f
6c9006de-1e88-4f0b-a798-e16475bf8dfd	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	74545d89-0336-41f8-b100-6b1a2c8cf381	5.00	pieces	2	\N	f
5dba69cc-1ed8-46f5-b0bd-c27f7b801556	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	6.00	pieces	3	\N	f
f3ab52c2-4c16-403a-807f-ca86a836ad73	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	4	\N	f
0b0a1d1e-632f-4e81-b31b-1bb92c2f7541	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	8.00	pieces	5	\N	f
d69f78c6-594c-4c55-8036-e6fb1e741add	25c7b705-b072-42a9-9a57-7e9cd9bc692c	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	10.00	pieces	0	\N	f
d25bd91f-b4e9-457d-a200-52f692420ea7	25c7b705-b072-42a9-9a57-7e9cd9bc692c	075c301f-67e2-4bff-bcc8-2d215fcdf849	10.00	pieces	1	\N	f
4bea4e49-a0f5-4e9d-b810-8c01015e050d	25c7b705-b072-42a9-9a57-7e9cd9bc692c	25149783-1d1a-4449-b54a-1068ca3405ba	4.00	pieces	2	\N	f
a6c44c59-eb7d-4ca8-936f-7c10be2ee393	25c7b705-b072-42a9-9a57-7e9cd9bc692c	973d147d-0217-41bf-bec2-ab39f80af20c	6.00	pieces	3	\N	f
1204b33a-53b6-41c6-94ea-4bfae948d25e	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	92820156-5037-4459-b7b6-8344ffabfd0d	2.00	kg	6	\N	f
35827d07-d2f3-47ab-8438-24bbbfb95f89	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	35c51dce-046e-41b8-abf8-df9b318116f7	3.00	pieces	7	\N	f
53b8f16c-5f4b-4ad6-9214-4983c9bee998	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	e76dcae7-c72d-4957-9aa7-d627003e5bb2	15.00	pieces	8	\N	f
75206836-f2aa-461d-98be-2f0004c407e6	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	94610731-af1b-4ecf-bee2-4c37feee8f1d	15.00	pieces	9	\N	f
5abb1ac4-0f17-4a12-a5c3-4b7216104583	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	6.00	pieces	10	\N	f
a7c43ae6-ec4c-4de6-aa9f-fa25235e9ccc	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	11	\N	f
93c57556-f9d1-4449-9508-2d195a91ef94	4f50bafa-b5dc-4e4d-a151-93cb945133b7	041ef8f9-ffc1-441d-920b-168d7f2597fd	7.00	pieces	2	\N	f
0907de48-9168-4d78-858f-917bef5605ab	4f50bafa-b5dc-4e4d-a151-93cb945133b7	92820156-5037-4459-b7b6-8344ffabfd0d	6.00	pieces	3	\N	f
fcf4ebb6-e522-4987-9ce0-dbd0f78aa0b3	4f50bafa-b5dc-4e4d-a151-93cb945133b7	94610731-af1b-4ecf-bee2-4c37feee8f1d	6.00	pieces	4	\N	f
2b71b7db-bdd1-4cb6-b3dc-909a042998a6	4f50bafa-b5dc-4e4d-a151-93cb945133b7	6ba8b958-628e-424f-8040-49cfaa00985d	12.00	pieces	5	\N	f
db268eb3-008d-4700-be40-5ec94ff280fe	4f50bafa-b5dc-4e4d-a151-93cb945133b7	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	6	\N	f
82afcc65-937b-4013-aa21-9606ff083aa2	4f50bafa-b5dc-4e4d-a151-93cb945133b7	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	7	\N	f
8d87b593-8078-4af6-9dff-fa440cfc38a2	4f50bafa-b5dc-4e4d-a151-93cb945133b7	075c301f-67e2-4bff-bcc8-2d215fcdf849	1.00	pieces	8	\N	f
bfd0e0c2-8508-43d2-b244-d7db6a16d58f	4f50bafa-b5dc-4e4d-a151-93cb945133b7	4e3e47a9-131c-4351-ac41-1bafd8c657ce	1.00	pieces	9	\N	f
4a24bf8f-09ae-48ce-95e3-d2a2927ba4da	4f50bafa-b5dc-4e4d-a151-93cb945133b7	7c5ce30a-c741-40c6-81b6-bd846f705efd	1.00	pieces	10	\N	f
2ef2200a-5602-47a3-af3e-c752a825843d	669f6abc-f8d0-44b2-90c7-4945d7229885	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	0	\N	f
e81d81b1-ead5-4791-9612-bd8a51cad172	6068d6c1-9abd-4685-b719-c17e233f8965	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	0	\N	f
af78dec9-d006-400d-ae85-f88dd6150ba8	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	176307fa-d193-4222-b90e-3e8b342e651e	120.00	pieces	12	\N	f
da75be1b-c25e-4924-b111-272103f3f779	6748e092-d2d1-49c4-b5c0-87e6a2284d2b	4e3e47a9-131c-4351-ac41-1bafd8c657ce	1.00	pieces	0	\N	f
72cc9fca-15f6-4c13-9a7e-5a80415b8ae0	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	0da5a062-f5c8-4c88-98af-075e5ab0a509	30.00	pieces	13	\N	f
bd4748db-4163-4e63-b307-031ca4b2be8c	2afbc9e8-92ad-4d08-bf05-1738abf27739	7c5ce30a-c741-40c6-81b6-bd846f705efd	15.00	pieces	0	\N	f
9fbfc172-496b-4229-a6ef-d6cd84580bc6	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	64f59ccf-be2a-4d15-ab83-94171e69a395	15.00	pieces	14	\N	f
13c2fae5-e265-4956-ad5d-f95826ace1b6	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	6ba8b958-628e-424f-8040-49cfaa00985d	15.00	pieces	15	\N	f
7cc05342-9b65-4c8e-9d90-c5a209a45783	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	18222ed3-19a9-44d6-a028-e6fb2068136d	12.00	pieces	16	\N	f
9fb6e323-19e2-40c5-8839-c7dd900a9a80	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	10.00	pieces	17	\N	f
5b7bb86d-6dc7-4a77-b1ca-31c93ae142ad	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	18	\N	f
721b69ab-fa91-47b3-88e5-a35fa6c99c3e	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	5a4efa43-c1c3-4a3f-96b6-748a2eecbec5	0.50	pieces	19	\N	f
752c62b4-187a-4076-a87d-aa6c599f34a6	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	20	\N	f
729761d3-917f-4acc-a129-5422c29e40c9	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	f9008beb-4663-4ceb-bd05-eefff8739259	1.00	pieces	21	\N	f
02d0cfb5-2a41-4910-afac-2ee9695606e2	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	1eea3318-ff50-409d-8759-9645f3aada40	6.00	pieces	22	\N	f
a880dc39-4f30-4fe0-92cb-07916013f355	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	4e3e47a9-131c-4351-ac41-1bafd8c657ce	10.00	pieces	23	\N	f
6e62e475-412a-41d5-8201-a8de4da88e9e	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	7c5ce30a-c741-40c6-81b6-bd846f705efd	4.00	pieces	24	\N	f
45bc510c-791e-4f37-8e40-b4d6624668fc	ca5256e3-6b31-4997-8fb8-0aadc8b590e8	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	4.00	pieces	25	\N	f
94491428-ec9f-4f8f-a44f-5922ecdff908	9e39141a-4f8a-4ec1-b797-8652e73629dd	18222ed3-19a9-44d6-a028-e6fb2068136d	3.00	pieces	6	\N	f
c8b4b86b-d01b-49da-a6bd-bc96d844fbac	9e39141a-4f8a-4ec1-b797-8652e73629dd	92820156-5037-4459-b7b6-8344ffabfd0d	30.00	pieces	7	\N	f
8ba4c4c7-8525-447b-a980-144cf889f8fe	9e39141a-4f8a-4ec1-b797-8652e73629dd	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	8	\N	f
5f3371ab-74a7-4a0f-a17e-dbf9d856d6c5	9e39141a-4f8a-4ec1-b797-8652e73629dd	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	9	\N	f
35b9cab5-0134-48f1-9701-aee060eaacb5	9e39141a-4f8a-4ec1-b797-8652e73629dd	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	10	\N	f
3cf11926-cbb8-47b8-ac3e-20e0f1f0ef31	9e39141a-4f8a-4ec1-b797-8652e73629dd	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	11	\N	f
77da4a75-fd36-4075-ba6d-71c98d6303d8	9e39141a-4f8a-4ec1-b797-8652e73629dd	a144d439-2b1a-41ee-bdbe-487b3423b642	10.00	pieces	12	\N	f
24665314-f906-41f6-b3cd-1738e466997a	5144d781-efad-4eb6-ab07-a00aaaa92bee	176307fa-d193-4222-b90e-3e8b342e651e	1.00	kg	0	\N	f
6814385c-cad6-464c-867e-6bb1c53b15d9	5144d781-efad-4eb6-ab07-a00aaaa92bee	0da5a062-f5c8-4c88-98af-075e5ab0a509	1.00	kg	1	\N	f
76849510-0926-42e8-8956-e99a5fffceb4	5144d781-efad-4eb6-ab07-a00aaaa92bee	041ef8f9-ffc1-441d-920b-168d7f2597fd	7.00	pieces	2	\N	f
fec8db34-b250-4fea-95ef-e3239e56812a	5144d781-efad-4eb6-ab07-a00aaaa92bee	92820156-5037-4459-b7b6-8344ffabfd0d	6.00	pieces	3	\N	f
fb3fe16e-9224-420c-9d90-be0f809a450c	5144d781-efad-4eb6-ab07-a00aaaa92bee	94610731-af1b-4ecf-bee2-4c37feee8f1d	6.00	pieces	4	\N	f
46167c39-4ded-459f-b1d9-2512f6a9636e	5144d781-efad-4eb6-ab07-a00aaaa92bee	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	5	\N	f
4c7d686b-daa6-4dea-ae0c-71ca7a7b3765	25c7b705-b072-42a9-9a57-7e9cd9bc692c	feebdc41-9a89-4de4-8860-6c06c81c002a	4.00	pieces	4	\N	f
287cf079-c18c-4a6f-8eb0-a4d14519721d	25c7b705-b072-42a9-9a57-7e9cd9bc692c	8b4a2f78-50b8-4374-a55b-a01b7aea7341	4.00	pieces	5	\N	f
ee742470-0aab-4d6b-9b82-8718115c5cd8	25c7b705-b072-42a9-9a57-7e9cd9bc692c	8b601429-3aa0-409c-adce-9c42a6d25736	2.00	pieces	6	\N	f
97bfc30a-efa6-4267-b7b1-af2e9f3813b4	dde20e7d-ad24-4010-bf7c-21be8673d0e4	a62fef1f-06a6-483c-b784-f90780697743	15.00	pieces	0	\N	f
d553367f-b692-40f1-98b8-bd04b563a1d2	dde20e7d-ad24-4010-bf7c-21be8673d0e4	8b601429-3aa0-409c-adce-9c42a6d25736	15.00	pieces	1	\N	f
a1f9bfbc-a85c-4f7b-ac9a-a7d33068da79	dde20e7d-ad24-4010-bf7c-21be8673d0e4	d6939926-e956-4295-96de-573dff94f2b2	15.00	pieces	2	\N	f
48e024d8-079e-4021-ba4c-16083551ae12	fa2934e9-2c9d-4992-a851-ec866ff667c8	46ecc1c7-459c-418d-a2ae-d336c9052445	40.00	pieces	0	\N	f
85f0c520-005d-4728-9d18-fc28b9726239	5144d781-efad-4eb6-ab07-a00aaaa92bee	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	6	\N	f
89749b38-a2af-4d6c-917e-6bc72feb9004	5144d781-efad-4eb6-ab07-a00aaaa92bee	6ba8b958-628e-424f-8040-49cfaa00985d	12.00	pieces	7	\N	f
26476b2f-9404-4331-8ed2-0fe14da9c1dd	5144d781-efad-4eb6-ab07-a00aaaa92bee	4e3e47a9-131c-4351-ac41-1bafd8c657ce	1.00	pieces	8	\N	f
7f8cda75-0a5b-4c00-9272-39b3426a8608	5144d781-efad-4eb6-ab07-a00aaaa92bee	7c5ce30a-c741-40c6-81b6-bd846f705efd	1.00	pieces	9	\N	f
a1eef631-6459-4c67-9b9d-7456aac42b92	5e47101b-7d24-400b-9bed-f84378afd330	18222ed3-19a9-44d6-a028-e6fb2068136d	4.00	pieces	0	\N	f
d677d3a3-ed93-483f-bbc5-35fd5c26d79f	5e47101b-7d24-400b-9bed-f84378afd330	6ba8b958-628e-424f-8040-49cfaa00985d	0.50	kg	1	\N	f
79276d10-15d5-4cb2-a29b-16030124ed31	5e47101b-7d24-400b-9bed-f84378afd330	176307fa-d193-4222-b90e-3e8b342e651e	0.50	kg	2	\N	f
f88b6576-e091-469c-b579-dc819eceb44a	5e47101b-7d24-400b-9bed-f84378afd330	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	3	\N	f
21ec6775-0763-4176-be53-6cb5864d87b6	14d7ba59-2d30-4dc2-a406-1e090a06b91c	176307fa-d193-4222-b90e-3e8b342e651e	35.00	pieces	0	\N	f
e64807ed-4bc3-49a9-8560-e27e23fce9df	14d7ba59-2d30-4dc2-a406-1e090a06b91c	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	0	\N	f
0875ed40-8790-44c8-a8d9-01591a5f4759	cf0c10b2-dd16-4575-967c-8be0c01aaa19	4e3e47a9-131c-4351-ac41-1bafd8c657ce	2.00	pieces	0	\N	f
17e82325-b25a-43ec-a9b2-cd5ae36fbecb	cf0c10b2-dd16-4575-967c-8be0c01aaa19	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	2.00	pieces	1	\N	f
a7d09614-1036-4083-92ba-1f73aabf0e1d	cf0c10b2-dd16-4575-967c-8be0c01aaa19	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	2	\N	f
8304da43-521a-4c90-9da0-c8da657420e2	00b57a27-e7a8-4e91-85d7-678245b9c0d2	6ba8b958-628e-424f-8040-49cfaa00985d	20.00	pieces	0	\N	f
29672e07-ad6d-4873-9b87-ab1a7e6d864f	00b57a27-e7a8-4e91-85d7-678245b9c0d2	0da5a062-f5c8-4c88-98af-075e5ab0a509	10.00	pieces	1	\N	f
78d0b4c3-a2d9-4b89-a94b-62fd26c667ab	00b57a27-e7a8-4e91-85d7-678245b9c0d2	176307fa-d193-4222-b90e-3e8b342e651e	25.00	pieces	2	\N	f
fa62ec64-51ba-4c2d-9999-1cdf0ee1fa6c	00b57a27-e7a8-4e91-85d7-678245b9c0d2	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	3	\N	f
68db1133-6e84-4a10-8806-cd2134551266	00b57a27-e7a8-4e91-85d7-678245b9c0d2	041ef8f9-ffc1-441d-920b-168d7f2597fd	6.00	pieces	4	\N	f
57d77da2-f9e5-4e83-a477-2dd2e39058d1	00b57a27-e7a8-4e91-85d7-678245b9c0d2	92820156-5037-4459-b7b6-8344ffabfd0d	8.00	pieces	5	\N	f
721d83ea-be66-42fb-b002-8f4e4e07fc53	00b57a27-e7a8-4e91-85d7-678245b9c0d2	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2.00	pieces	6	\N	f
6452cd20-43df-4e89-8429-dfdbd080ec92	00b57a27-e7a8-4e91-85d7-678245b9c0d2	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	7	\N	f
ad99fa12-ab84-4382-a909-09dd0648e6b5	00b57a27-e7a8-4e91-85d7-678245b9c0d2	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	8	\N	f
69a26f42-5855-406d-8de6-57fdb5419359	00b57a27-e7a8-4e91-85d7-678245b9c0d2	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	9	\N	f
f8aebde8-406b-49e2-97bd-7eb33f64f2f6	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	8480b77a-07cd-4b5d-8769-2af7e717b684	5.00	pieces	0	\N	f
a5e19b4c-8db3-49a4-9afa-1dc9ca5b11e7	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	0	\N	f
ac603194-4558-43a6-8900-a51168821fd2	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	0	\N	f
b6e65238-8455-43df-bab2-4ec5e619a3f0	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	041ef8f9-ffc1-441d-920b-168d7f2597fd	10.00	pieces	0	\N	f
2e74ebeb-247f-43f9-9fba-2b13a523bfae	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	176307fa-d193-4222-b90e-3e8b342e651e	2.00	kg	0	\N	f
9af9b1e2-5ace-4924-90d5-d3fb6b480d4c	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	0	\N	f
819c026b-943e-4b51-9218-42d1d6ec62d7	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	64f59ccf-be2a-4d15-ab83-94171e69a395	14.00	pieces	0	\N	f
3f5050b1-37a3-4cda-acfe-547a798d4018	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	973d147d-0217-41bf-bec2-ab39f80af20c	2.00	pieces	0	\N	f
44beaa69-b181-4902-b6c5-5b1759b52cca	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	feebdc41-9a89-4de4-8860-6c06c81c002a	2.00	pieces	0	\N	f
1b092952-3066-4e46-946c-7d1fbf984d12	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	075c301f-67e2-4bff-bcc8-2d215fcdf849	20.00	pieces	0	\N	f
f3c10c90-0ec2-4f2a-b1da-d5a33e85dc50	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	74545d89-0336-41f8-b100-6b1a2c8cf381	4.00	pieces	0	\N	f
6d0254a2-1701-40aa-aee1-1cda72747efa	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	0	\N	f
5f59786a-7d92-4b5b-8181-9a652d7ab280	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	43620106-1595-430e-b31d-a30a17304cec	0.50	pieces	0	\N	f
2d3a15f7-7635-46a3-b416-7d8155141277	b9d38fa5-4254-411f-bdb1-d91d2f8a5291	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.00	pieces	0	\N	f
ad2e944c-b8a8-4503-b567-3c03765ad750	00b57a27-e7a8-4e91-85d7-678245b9c0d2	075c301f-67e2-4bff-bcc8-2d215fcdf849	1.00	pieces	10	\N	f
72e43fc7-d30f-4f51-b575-5786d2c48c6b	00b57a27-e7a8-4e91-85d7-678245b9c0d2	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	11	\N	f
902365e0-e985-4cee-bc65-c6b18a89334f	00b57a27-e7a8-4e91-85d7-678245b9c0d2	7c5ce30a-c741-40c6-81b6-bd846f705efd	3.00	pieces	12	\N	f
9032693f-c353-4540-bfb4-2b8ffc67d530	00b57a27-e7a8-4e91-85d7-678245b9c0d2	1eea3318-ff50-409d-8759-9645f3aada40	6.00	pieces	13	\N	f
827840fc-f635-491f-8d75-b9997a9f8998	00b57a27-e7a8-4e91-85d7-678245b9c0d2	f9008beb-4663-4ceb-bd05-eefff8739259	1.00	pieces	14	\N	f
bee69241-10c1-4f0a-8db6-4cd27cc27b92	ba7cd36d-f648-4020-be65-a6f832bb70a3	6ba8b958-628e-424f-8040-49cfaa00985d	25.00	pieces	0	\N	f
f5ade9ba-467d-4af6-828b-db7f4484b519	ba7cd36d-f648-4020-be65-a6f832bb70a3	0da5a062-f5c8-4c88-98af-075e5ab0a509	15.00	pieces	1	\N	f
2b38a75f-e457-429a-85e0-2082f0ad02da	ba7cd36d-f648-4020-be65-a6f832bb70a3	176307fa-d193-4222-b90e-3e8b342e651e	35.00	pieces	2	\N	f
ca9ed618-87ae-4000-bbb2-fd4a81fcf9f4	ba7cd36d-f648-4020-be65-a6f832bb70a3	f4665f7d-81b6-414d-9cb9-b962febfe50b	15.00	pieces	3	\N	f
76df3690-4937-4f1b-aa87-d6944be053c9	0a2081d5-57e8-4835-b96b-431787ecb1f2	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	0	\N	f
2f577e14-3437-47e9-8471-4b466b8ebd10	0a2081d5-57e8-4835-b96b-431787ecb1f2	041ef8f9-ffc1-441d-920b-168d7f2597fd	8.00	pieces	1	\N	f
7c0bc5b4-b3bd-440a-9ca2-01643a175eea	ba7cd36d-f648-4020-be65-a6f832bb70a3	041ef8f9-ffc1-441d-920b-168d7f2597fd	10.00	pieces	4	\N	f
b8087301-85d3-4ff9-85b3-08c34817a9dc	ba7cd36d-f648-4020-be65-a6f832bb70a3	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	5	\N	f
33339d24-3736-4073-9b72-82703df6045b	ba7cd36d-f648-4020-be65-a6f832bb70a3	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	6	\N	f
24207257-b449-423e-966e-ee632550634f	ba7cd36d-f648-4020-be65-a6f832bb70a3	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	2.00	pieces	7	\N	f
29103d0e-c804-4b0f-a052-af3d22cb2a22	ba7cd36d-f648-4020-be65-a6f832bb70a3	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	8	\N	f
32d84f30-e526-4891-bfef-df9a6bae7c25	ba7cd36d-f648-4020-be65-a6f832bb70a3	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	9	\N	f
3e90c59f-9230-4131-8a19-e1e3a9654bc9	ba7cd36d-f648-4020-be65-a6f832bb70a3	8b4a2f78-50b8-4374-a55b-a01b7aea7341	2.00	pieces	10	\N	f
679e9da4-99ff-4010-86de-ddc23afb3c5f	1bd6788a-85c5-4549-8763-570b811266ca	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	0	\N	f
ff09b8c1-c225-4081-b644-61c4d54e8f9e	1bd6788a-85c5-4549-8763-570b811266ca	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	2.00	pieces	1	\N	f
0357ced2-eda3-493a-9071-a82ab07531f7	1bd6788a-85c5-4549-8763-570b811266ca	7c5ce30a-c741-40c6-81b6-bd846f705efd	1.00	pieces	2	\N	f
09285778-4e6e-4029-9df2-44befeb79624	ba7cd36d-f648-4020-be65-a6f832bb70a3	075c301f-67e2-4bff-bcc8-2d215fcdf849	3.00	pieces	11	\N	f
e249a42d-5ad5-4089-ab22-878815b547c3	ba7cd36d-f648-4020-be65-a6f832bb70a3	fbc92d53-9184-48c5-8fb6-08eb94762912	2.00	pieces	12	\N	f
e0252f8a-c820-4376-9bf6-5860f8de1510	ba7cd36d-f648-4020-be65-a6f832bb70a3	4e3e47a9-131c-4351-ac41-1bafd8c657ce	2.00	pieces	13	\N	f
188fe98c-014e-4677-af92-6a6cbf3de820	ba7cd36d-f648-4020-be65-a6f832bb70a3	7c5ce30a-c741-40c6-81b6-bd846f705efd	3.00	pieces	14	\N	f
8fe3900b-dee9-4800-a5d1-a3a4743d612e	ba7cd36d-f648-4020-be65-a6f832bb70a3	34e7679d-b1d8-40b2-8359-be4a30e1a981	2.00	pieces	15	\N	f
26c3dfdb-3075-4064-ac01-8bfebca1d8d1	ba7cd36d-f648-4020-be65-a6f832bb70a3	1eea3318-ff50-409d-8759-9645f3aada40	6.00	pieces	16	\N	f
3738fd36-e0ca-4ded-b92e-f04ed4b0d667	0a2081d5-57e8-4835-b96b-431787ecb1f2	e76dcae7-c72d-4957-9aa7-d627003e5bb2	5.00	pieces	2	\N	f
1f411102-5f13-4abe-ab87-0bcab4494e9f	0a2081d5-57e8-4835-b96b-431787ecb1f2	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	8.00	pieces	3	\N	f
0f218a1d-e4a7-4c1f-a84d-eb58b183aa08	ba7cd36d-f648-4020-be65-a6f832bb70a3	e76dcae7-c72d-4957-9aa7-d627003e5bb2	15.00	pieces	17	\N	f
39bf3538-ce9d-415c-85a9-bb8e2182a9ec	0a2081d5-57e8-4835-b96b-431787ecb1f2	6ba8b958-628e-424f-8040-49cfaa00985d	8.00	pieces	4	\N	f
e6012373-7af6-4bc3-aa1b-8890d7215e17	0a2081d5-57e8-4835-b96b-431787ecb1f2	0da5a062-f5c8-4c88-98af-075e5ab0a509	12.00	pieces	5	\N	f
16bdd41d-6d88-446a-8cae-ff8a503f2e43	0a2081d5-57e8-4835-b96b-431787ecb1f2	92820156-5037-4459-b7b6-8344ffabfd0d	16.00	pieces	6	\N	f
685065de-ea2d-4139-9fb0-cc12729e9bf4	0a2081d5-57e8-4835-b96b-431787ecb1f2	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	7	\N	f
cd759ab5-5d1f-4d3a-99ab-1769d4bed6af	2c3aaeae-5700-4485-b765-69e6ca76f5b5	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	0	\N	f
79651387-85aa-4e26-a380-a5e57ee1e2cb	2c3aaeae-5700-4485-b765-69e6ca76f5b5	041ef8f9-ffc1-441d-920b-168d7f2597fd	10.00	pieces	1	\N	f
4569f9bc-6274-4e48-9483-afafaba0b803	2c3aaeae-5700-4485-b765-69e6ca76f5b5	e76dcae7-c72d-4957-9aa7-d627003e5bb2	2.00	pieces	2	\N	f
fc658265-99ae-4e4b-a48a-b09ec9281482	2c3aaeae-5700-4485-b765-69e6ca76f5b5	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	15.00	pieces	3	\N	f
d5bc3df6-398b-47b3-9eac-96d3f04ad7a4	8e77e722-4646-4157-8c96-f631e5c5951c	075c301f-67e2-4bff-bcc8-2d215fcdf849	12.00	pieces	0	\N	f
6cdd2cb1-4cda-4a02-a2ee-693bc72ec2f9	8e77e722-4646-4157-8c96-f631e5c5951c	973d147d-0217-41bf-bec2-ab39f80af20c	5.00	pieces	1	\N	f
3fac3016-d8b5-42e4-a6fe-7a29759cfa66	8e77e722-4646-4157-8c96-f631e5c5951c	25149783-1d1a-4449-b54a-1068ca3405ba	1.00	pieces	2	\N	f
5dfd5d5e-db1c-4367-a061-0d1f6b0a6f71	8e77e722-4646-4157-8c96-f631e5c5951c	feebdc41-9a89-4de4-8860-6c06c81c002a	1.00	pieces	3	\N	f
cdb6fede-7242-48e5-b9d8-35ee2d553962	8e77e722-4646-4157-8c96-f631e5c5951c	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	4.00	pieces	4	\N	f
de89edba-6d09-4d17-9e97-eba9ed7908d9	8e77e722-4646-4157-8c96-f631e5c5951c	fbc92d53-9184-48c5-8fb6-08eb94762912	1.00	pieces	5	\N	f
bfb3fdd4-ed81-434f-81f2-fe28b24e2bad	8e77e722-4646-4157-8c96-f631e5c5951c	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	6	\N	f
50377868-a3b1-4e73-822b-eba3b548e3cf	8e77e722-4646-4157-8c96-f631e5c5951c	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	3.00	pieces	7	\N	f
70e73dc6-3adf-44d3-bbd7-38e152f0da66	8e77e722-4646-4157-8c96-f631e5c5951c	74545d89-0336-41f8-b100-6b1a2c8cf381	8.00	pieces	8	\N	f
35a97b69-37bf-4c78-a11f-8f699e43017d	8e77e722-4646-4157-8c96-f631e5c5951c	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	15.00	pieces	9	\N	f
a801af69-b863-417b-bff4-f1f95c7cf36c	8e77e722-4646-4157-8c96-f631e5c5951c	f4665f7d-81b6-414d-9cb9-b962febfe50b	0.50	kg	10	\N	f
e15b9f91-42ff-436b-a30e-aa9d70182750	8e77e722-4646-4157-8c96-f631e5c5951c	94610731-af1b-4ecf-bee2-4c37feee8f1d	0.50	kg	11	\N	f
2a202f5a-f65b-4bb5-ad0a-217c81137c98	8e77e722-4646-4157-8c96-f631e5c5951c	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.50	kg	12	\N	f
56327d28-a187-4ff0-a0ea-f1ed9e74610e	8e77e722-4646-4157-8c96-f631e5c5951c	92820156-5037-4459-b7b6-8344ffabfd0d	2.00	kg	13	\N	f
31eb9fde-e5d7-4cad-99ea-e5e34765415a	8e77e722-4646-4157-8c96-f631e5c5951c	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	14	\N	f
30605795-840d-4025-98db-2b0d7627efb5	8e77e722-4646-4157-8c96-f631e5c5951c	0da5a062-f5c8-4c88-98af-075e5ab0a509	3.50	kg	15	\N	f
7558424b-2602-4cb6-bc2a-e6604ca400a4	8e77e722-4646-4157-8c96-f631e5c5951c	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	16	\N	f
55532036-0547-4fdc-9a91-2c7ebcda4748	8e77e722-4646-4157-8c96-f631e5c5951c	64f59ccf-be2a-4d15-ab83-94171e69a395	2.00	kg	17	\N	f
d0b675aa-03c1-4633-bbe3-ce65086ee8f2	8e77e722-4646-4157-8c96-f631e5c5951c	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	15.00	pieces	18	\N	f
1838b673-cd53-4322-a74f-a31e6ec46a10	8e77e722-4646-4157-8c96-f631e5c5951c	35c51dce-046e-41b8-abf8-df9b318116f7	4.00	pieces	19	\N	f
ec737a59-b1ce-455d-a90c-954c95b88c8a	8e77e722-4646-4157-8c96-f631e5c5951c	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	10.00	pieces	20	\N	f
8e6ae573-0ac5-4714-a4cb-d508d4f37637	8e77e722-4646-4157-8c96-f631e5c5951c	6ba8b958-628e-424f-8040-49cfaa00985d	2.00	kg	21	\N	f
8834d8d0-6cdd-4309-b51a-ec9059e72064	8e77e722-4646-4157-8c96-f631e5c5951c	e76dcae7-c72d-4957-9aa7-d627003e5bb2	1.00	kg	22	\N	f
be50cbd0-8872-42aa-80c9-a951ac255f48	8e77e722-4646-4157-8c96-f631e5c5951c	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	11.00	pieces	23	\N	f
4f2ee173-b639-492d-a23f-a23c83e596e5	8e77e722-4646-4157-8c96-f631e5c5951c	8480b77a-07cd-4b5d-8769-2af7e717b684	2.00	pieces	24	\N	f
28ed3ef4-77ec-41ad-8933-c2fa3c3e31cc	8e77e722-4646-4157-8c96-f631e5c5951c	4e3e47a9-131c-4351-ac41-1bafd8c657ce	10.00	pieces	25	\N	f
e3ddc4d6-5512-47db-937e-f838d1c52211	8e77e722-4646-4157-8c96-f631e5c5951c	7c5ce30a-c741-40c6-81b6-bd846f705efd	5.00	pieces	26	\N	f
0a280ea3-ebb3-400e-85ab-637ef7d480a5	8e77e722-4646-4157-8c96-f631e5c5951c	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.50	pieces	27	\N	f
063ca31e-0920-4c46-900b-acf6af5367c7	8e77e722-4646-4157-8c96-f631e5c5951c	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	28	\N	f
5c3446da-fff1-4a2d-a57b-de118065bd00	8e77e722-4646-4157-8c96-f631e5c5951c	f9008beb-4663-4ceb-bd05-eefff8739259	2.00	pieces	29	\N	f
94143db0-a91e-49f6-8e61-2482508947e5	2c3aaeae-5700-4485-b765-69e6ca76f5b5	6ba8b958-628e-424f-8040-49cfaa00985d	8.00	pieces	4	\N	f
bf5b07d6-adeb-4832-8335-e5563d40122b	2c3aaeae-5700-4485-b765-69e6ca76f5b5	0da5a062-f5c8-4c88-98af-075e5ab0a509	18.00	pieces	5	\N	f
1b6cf56b-a11e-4b38-b02e-34718c4f717e	2c3aaeae-5700-4485-b765-69e6ca76f5b5	92820156-5037-4459-b7b6-8344ffabfd0d	24.00	pieces	6	\N	f
6b690d16-a98c-4f80-ab93-1e6192e78786	2c3aaeae-5700-4485-b765-69e6ca76f5b5	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	7	\N	f
a7e68066-605b-4e47-bb0b-141ffe32f037	2c3aaeae-5700-4485-b765-69e6ca76f5b5	8480b77a-07cd-4b5d-8769-2af7e717b684	3.00	pieces	8	\N	f
266689ea-2c45-4fd7-bfbe-9b979caf3dee	2c3aaeae-5700-4485-b765-69e6ca76f5b5	075c301f-67e2-4bff-bcc8-2d215fcdf849	3.00	pieces	9	\N	f
abfd7f21-6d3c-4a8c-9c12-a822687e2958	2c3aaeae-5700-4485-b765-69e6ca76f5b5	18222ed3-19a9-44d6-a028-e6fb2068136d	3.00	pieces	10	\N	f
e96c61e7-268a-4009-a2ab-96bfbfed9e9e	65b93158-a34e-46ca-89b9-c219e4110984	35c51dce-046e-41b8-abf8-df9b318116f7	2.00	pieces	0	\N	f
00755c4a-e70a-4263-b78c-6e6c572a5351	65b93158-a34e-46ca-89b9-c219e4110984	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	1	\N	f
1de4f0ac-22b1-4361-ae44-9b05a3ce7890	65b93158-a34e-46ca-89b9-c219e4110984	94610731-af1b-4ecf-bee2-4c37feee8f1d	12.00	pieces	2	\N	f
4f7a124d-7dad-4b74-8916-049e1aaa43be	65b93158-a34e-46ca-89b9-c219e4110984	f4665f7d-81b6-414d-9cb9-b962febfe50b	24.00	pieces	3	\N	f
44d5ce9b-b718-4b83-afa5-4f11d8e5211d	65b93158-a34e-46ca-89b9-c219e4110984	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	4	\N	f
1785c764-5f7f-485a-85a1-e678ce50aee5	65b93158-a34e-46ca-89b9-c219e4110984	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.50	kg	5	\N	f
3ecfef7e-128c-45ac-99c4-4ee10ac03159	65b93158-a34e-46ca-89b9-c219e4110984	18222ed3-19a9-44d6-a028-e6fb2068136d	6.00	pieces	6	\N	f
9ca29d2b-e8aa-4e28-890a-a521b7035230	65b93158-a34e-46ca-89b9-c219e4110984	0da5a062-f5c8-4c88-98af-075e5ab0a509	4.00	kg	7	\N	f
f796be03-6768-4ad1-8236-fce69b78f73f	65b93158-a34e-46ca-89b9-c219e4110984	176307fa-d193-4222-b90e-3e8b342e651e	2.00	kg	8	\N	f
d7e8718a-dc56-447a-adf6-99dab7dcd616	65b93158-a34e-46ca-89b9-c219e4110984	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	8.00	pieces	9	\N	f
ced9906f-860f-4bb9-b054-e8a82812f42f	65b93158-a34e-46ca-89b9-c219e4110984	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	10	\N	f
4d85a98a-7603-4725-94a2-9bb5818a6384	65b93158-a34e-46ca-89b9-c219e4110984	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	11	\N	f
324d2d12-044f-41ce-a85c-59910cfec082	65b93158-a34e-46ca-89b9-c219e4110984	620723fb-8ddc-43c6-b1b8-24a471d05dd3	2.00	pieces	12	\N	f
e47fa1a3-5486-4cd8-91c4-25cd4a24a229	65b93158-a34e-46ca-89b9-c219e4110984	fbc92d53-9184-48c5-8fb6-08eb94762912	1.00	pieces	13	\N	f
96d5c224-07c4-483f-8dc2-0ae16515d570	65b93158-a34e-46ca-89b9-c219e4110984	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	14	\N	f
159315c0-ee6a-4ade-b944-9486faab02ba	65b93158-a34e-46ca-89b9-c219e4110984	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	2.00	pieces	15	\N	f
83f3fb70-08bd-4a20-9857-cf72ad26222e	034328f3-db77-4eb7-8c12-4a84b8b7e868	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	5.00	pieces	0	\N	f
3047625f-16d6-4571-bd9a-a137a843ff86	034328f3-db77-4eb7-8c12-4a84b8b7e868	620723fb-8ddc-43c6-b1b8-24a471d05dd3	6.00	pieces	1	\N	f
7cd5b255-afaa-40d3-849e-e658dbb819b3	034328f3-db77-4eb7-8c12-4a84b8b7e868	970e4480-02e3-4088-b77a-8a0e74c85886	2.00	pieces	2	\N	f
0a3a1e05-3c9c-45a7-a2f2-2aa28129eee0	034328f3-db77-4eb7-8c12-4a84b8b7e868	35c51dce-046e-41b8-abf8-df9b318116f7	6.00	pieces	3	\N	f
6eae3958-14e9-4907-b6f6-4a2536895437	034328f3-db77-4eb7-8c12-4a84b8b7e868	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	4	\N	f
218874e5-834b-4131-b3b1-3102cb82e57f	034328f3-db77-4eb7-8c12-4a84b8b7e868	e76dcae7-c72d-4957-9aa7-d627003e5bb2	0.50	kg	5	\N	f
c2fe0d5a-ed31-4450-a6d2-04badc429bb5	034328f3-db77-4eb7-8c12-4a84b8b7e868	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	6	\N	f
afe4cec6-2a86-4793-92c3-f038af1ab294	034328f3-db77-4eb7-8c12-4a84b8b7e868	041ef8f9-ffc1-441d-920b-168d7f2597fd	3.00	kg	7	\N	f
c398f8ed-23d0-48a2-92b6-80c166b81fbf	034328f3-db77-4eb7-8c12-4a84b8b7e868	0da5a062-f5c8-4c88-98af-075e5ab0a509	2.00	kg	8	\N	f
6bb4242b-c661-484e-8fce-7b6e49424e10	034328f3-db77-4eb7-8c12-4a84b8b7e868	176307fa-d193-4222-b90e-3e8b342e651e	1.00	kg	9	\N	f
c22ecf45-0121-4b80-b496-320014219b0b	034328f3-db77-4eb7-8c12-4a84b8b7e868	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	10	\N	f
d615b623-6680-4e6c-a318-8f5e35d5fd7d	034328f3-db77-4eb7-8c12-4a84b8b7e868	075c301f-67e2-4bff-bcc8-2d215fcdf849	6.00	pieces	11	\N	f
0d53a797-e688-481a-92d4-457252ade3b7	034328f3-db77-4eb7-8c12-4a84b8b7e868	feebdc41-9a89-4de4-8860-6c06c81c002a	3.00	pieces	12	\N	f
ab48a0ce-2900-44c0-9203-1f033da867d3	034328f3-db77-4eb7-8c12-4a84b8b7e868	74545d89-0336-41f8-b100-6b1a2c8cf381	8.00	pieces	13	\N	f
62091bed-5082-4bba-9e78-b8113ea0038f	034328f3-db77-4eb7-8c12-4a84b8b7e868	4e3e47a9-131c-4351-ac41-1bafd8c657ce	6.00	pieces	14	\N	f
7e229198-79b0-4cfa-9995-86d54d604ffc	034328f3-db77-4eb7-8c12-4a84b8b7e868	7c5ce30a-c741-40c6-81b6-bd846f705efd	4.00	pieces	15	\N	f
a654a8c8-2cf6-47eb-a7a4-0db25d3766fd	034328f3-db77-4eb7-8c12-4a84b8b7e868	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	4.00	pieces	16	\N	f
44c57410-4f58-4e81-b8c4-046d61ef89c0	e7223ca2-7bfa-45b8-a564-610ccdf8037a	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	0	\N	f
4678758a-f181-46ef-86c6-3468e63e78af	e7223ca2-7bfa-45b8-a564-610ccdf8037a	0da5a062-f5c8-4c88-98af-075e5ab0a509	3.50	kg	1	\N	f
d720864b-7116-4ada-b49f-db374f076815	e7223ca2-7bfa-45b8-a564-610ccdf8037a	6ba8b958-628e-424f-8040-49cfaa00985d	1.00	kg	2	\N	f
370db50b-b2ac-4397-a148-67d914cf826f	e7223ca2-7bfa-45b8-a564-610ccdf8037a	176307fa-d193-4222-b90e-3e8b342e651e	3.50	kg	3	\N	f
472a7aae-f53e-4f8f-a57b-d2a3bcf6e583	e7223ca2-7bfa-45b8-a564-610ccdf8037a	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	4	\N	f
3d71b7a0-150a-4252-865b-9cab25d70dfb	e7223ca2-7bfa-45b8-a564-610ccdf8037a	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.00	kg	5	\N	f
58e5b0ce-7cfa-444d-9856-c844f732d84e	e7223ca2-7bfa-45b8-a564-610ccdf8037a	620723fb-8ddc-43c6-b1b8-24a471d05dd3	5.00	pieces	6	\N	f
c047e23b-5723-49c6-9254-c1ee45b163c1	5b225055-a7b4-4141-b208-722fd8d2397c	176307fa-d193-4222-b90e-3e8b342e651e	1.50	kg	0	\N	f
53652c7d-8dcc-4483-b1bd-fd7eb6293ae2	5b225055-a7b4-4141-b208-722fd8d2397c	0da5a062-f5c8-4c88-98af-075e5ab0a509	1.50	kg	1	\N	f
0f9e8c48-4e49-4ba9-ae01-91c002d0917a	5b225055-a7b4-4141-b208-722fd8d2397c	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.00	pieces	2	\N	f
b1b61cd4-daca-4142-8b8c-07afa4d061d2	5b225055-a7b4-4141-b208-722fd8d2397c	92820156-5037-4459-b7b6-8344ffabfd0d	6.00	pieces	3	\N	f
fe252bee-6c0e-4814-a0d3-049feefc2930	5b225055-a7b4-4141-b208-722fd8d2397c	94610731-af1b-4ecf-bee2-4c37feee8f1d	6.00	pieces	4	\N	f
9a7033c2-235f-4d2c-94a7-0cbd31019682	90f1b9cf-eff6-4363-abb7-b7693e90f5e4	0da5a062-f5c8-4c88-98af-075e5ab0a509	8.00	kg	0	\N	f
35e36077-c2d9-4037-95cf-7097f1a1f60e	90f1b9cf-eff6-4363-abb7-b7693e90f5e4	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	1	\N	f
f79a61ae-0781-4b70-b0c9-26da9f6b4ce5	90f1b9cf-eff6-4363-abb7-b7693e90f5e4	041ef8f9-ffc1-441d-920b-168d7f2597fd	2.00	kg	2	\N	f
05cdf868-bc35-49b8-8e68-4b9b3450ede3	90f1b9cf-eff6-4363-abb7-b7693e90f5e4	92820156-5037-4459-b7b6-8344ffabfd0d	3.00	kg	3	\N	f
fab9d892-ecc6-4b1b-b06a-9aa053aac373	90f1b9cf-eff6-4363-abb7-b7693e90f5e4	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	10.00	pieces	4	\N	f
acdbe349-42c0-4fe8-88fd-a1b074b66ffb	90f1b9cf-eff6-4363-abb7-b7693e90f5e4	18222ed3-19a9-44d6-a028-e6fb2068136d	4.00	pieces	5	\N	f
d614a87e-0f80-4553-a2b6-685e2721a0a7	90f1b9cf-eff6-4363-abb7-b7693e90f5e4	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	4.00	pieces	6	\N	f
c09b6f9a-0c44-4242-82f6-a8acfadfd1f7	90f1b9cf-eff6-4363-abb7-b7693e90f5e4	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	7	\N	f
73e39867-7051-4c8f-afda-a09cb4760790	90f1b9cf-eff6-4363-abb7-b7693e90f5e4	973d147d-0217-41bf-bec2-ab39f80af20c	2.00	pieces	8	\N	f
838fb205-40dc-44cf-b93f-e4515f0dd8c3	a1758b01-04fd-4751-9d0b-2ae1682bcd0e	0da5a062-f5c8-4c88-98af-075e5ab0a509	50.00	pieces	0	\N	f
452ba4d7-f122-49e8-bb0c-460ff09bf94f	a1758b01-04fd-4751-9d0b-2ae1682bcd0e	041ef8f9-ffc1-441d-920b-168d7f2597fd	5.00	pieces	1	\N	f
49568505-d4ac-479b-94d7-ee31dff99074	a1758b01-04fd-4751-9d0b-2ae1682bcd0e	18222ed3-19a9-44d6-a028-e6fb2068136d	27.00	pieces	2	\N	f
946bd255-9bae-44bc-a9d6-0e3165bc935d	a1758b01-04fd-4751-9d0b-2ae1682bcd0e	075c301f-67e2-4bff-bcc8-2d215fcdf849	1.00	pieces	3	\N	f
f7397d88-3acb-4ce0-a7cd-8483f06d95e3	a1758b01-04fd-4751-9d0b-2ae1682bcd0e	620723fb-8ddc-43c6-b1b8-24a471d05dd3	10.00	pieces	4	\N	f
9ed4d608-003e-4625-873b-17200ed86599	a1758b01-04fd-4751-9d0b-2ae1682bcd0e	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	2.50	pieces	5	\N	f
a4d23f18-4a1f-4c57-ae4c-75e0315c9e78	a1758b01-04fd-4751-9d0b-2ae1682bcd0e	a62fef1f-06a6-483c-b784-f90780697743	2.00	pieces	6	\N	f
6fee21c9-00c0-4068-a494-1d210c9b23a0	a1758b01-04fd-4751-9d0b-2ae1682bcd0e	d6939926-e956-4295-96de-573dff94f2b2	2.00	pieces	7	\N	f
8cd1f88a-9ebe-4344-bc1a-7ddd230fe48b	93125c8f-fc83-4497-909e-029227179a57	176307fa-d193-4222-b90e-3e8b342e651e	2.50	kg	0	\N	f
bf8429dd-b2ef-44ab-b7c0-7789d93606c0	93125c8f-fc83-4497-909e-029227179a57	37d66304-d6b6-4261-a065-1be24aeb104b	25.00	pieces	1	\N	f
3f25ab83-ca4a-40be-9a47-5d6497c1e651	93125c8f-fc83-4497-909e-029227179a57	4c964f81-b74d-4fe8-a53a-e0491645336b	20.00	pieces	2	\N	f
9a396b7b-e4ac-4f1b-b3ea-2b545ab99d52	93125c8f-fc83-4497-909e-029227179a57	e76dcae7-c72d-4957-9aa7-d627003e5bb2	10.00	pieces	3	\N	f
915ec665-6769-4a50-8f7f-26f467400fd7	93125c8f-fc83-4497-909e-029227179a57	f4665f7d-81b6-414d-9cb9-b962febfe50b	15.00	pieces	4	\N	f
c37f4ce6-77a6-480d-ac4b-9228963b3889	93125c8f-fc83-4497-909e-029227179a57	041ef8f9-ffc1-441d-920b-168d7f2597fd	60.00	pieces	5	\N	f
10c6b55a-eb45-46b7-a843-a5726c483d18	93125c8f-fc83-4497-909e-029227179a57	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	6	\N	f
b7f63200-0994-4ca7-b372-deb127b36ee3	93125c8f-fc83-4497-909e-029227179a57	92820156-5037-4459-b7b6-8344ffabfd0d	30.00	pieces	7	\N	f
f076cc8e-5ad0-440d-8e38-95d7a9469b90	93125c8f-fc83-4497-909e-029227179a57	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	8	\N	f
7aaf8eab-9451-4f45-bca8-241f5776a47a	93125c8f-fc83-4497-909e-029227179a57	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	9	\N	f
563c7b31-793a-4f16-81b9-543d76afd039	93125c8f-fc83-4497-909e-029227179a57	620723fb-8ddc-43c6-b1b8-24a471d05dd3	2.00	pieces	10	\N	f
9a7d400e-30a4-44f8-afd8-5cf6d0507c4c	93125c8f-fc83-4497-909e-029227179a57	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	10.00	pieces	11	\N	f
ab616304-e8d3-4692-a803-742e2ced5b11	93125c8f-fc83-4497-909e-029227179a57	075c301f-67e2-4bff-bcc8-2d215fcdf849	10.00	pieces	12	\N	f
c42f4177-0d51-4416-8dfe-2b59066f6770	93125c8f-fc83-4497-909e-029227179a57	8b4a2f78-50b8-4374-a55b-a01b7aea7341	2.00	pieces	13	\N	f
5b68af46-ee5d-4610-9003-eb23eaf29bc4	93125c8f-fc83-4497-909e-029227179a57	a62fef1f-06a6-483c-b784-f90780697743	2.00	pieces	14	\N	f
373900c8-ff5c-45b7-8a1f-f3e6cfe5c587	93125c8f-fc83-4497-909e-029227179a57	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	15	\N	f
ea93b487-1639-49df-8e62-274ddc4321c5	58179021-c117-4ee6-9838-7d4891892d40	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	2.00	pieces	2	\N	f
6860306e-819a-4160-b5fb-acfc11729884	58179021-c117-4ee6-9838-7d4891892d40	0da5a062-f5c8-4c88-98af-075e5ab0a509	5.00	pieces	3	\N	f
a1a8cdfb-2d6b-47c5-b670-aed24d1b385a	58179021-c117-4ee6-9838-7d4891892d40	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	4	\N	f
1f515109-667a-4a45-b7a5-174b1def921c	f1f7e226-b4e0-4e72-9e99-12326ff4b12c	0da5a062-f5c8-4c88-98af-075e5ab0a509	15.00	pieces	0	\N	f
e2f9df1a-583a-49f9-8baa-798bbe79945a	f1f7e226-b4e0-4e72-9e99-12326ff4b12c	041ef8f9-ffc1-441d-920b-168d7f2597fd	5.00	pieces	1	\N	f
783b10d4-1b7c-46c1-bb16-12ea1855b949	f1f7e226-b4e0-4e72-9e99-12326ff4b12c	18222ed3-19a9-44d6-a028-e6fb2068136d	2.00	pieces	2	\N	f
8b05d83a-d7f7-40fd-8656-c5254088a735	b4d436c0-dc7a-46fb-947e-fc2f835e81be	46ecc1c7-459c-418d-a2ae-d336c9052445	10.00	pieces	0	\N	f
c61ec886-99a7-49b7-8a95-c54b398e2538	b4d436c0-dc7a-46fb-947e-fc2f835e81be	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	2.00	pieces	1	\N	f
537a8cf9-1f28-4af0-977f-65e077f444d7	34b57f7b-910f-4ac4-b647-9d4e565e02fa	25149783-1d1a-4449-b54a-1068ca3405ba	1.00	pieces	0	\N	f
93508628-d975-4daf-b615-d09b5c354c0d	34b57f7b-910f-4ac4-b647-9d4e565e02fa	075c301f-67e2-4bff-bcc8-2d215fcdf849	3.00	pieces	1	\N	f
e7ec2ca5-3b89-4e9b-b86c-5fc8c635ea07	34b57f7b-910f-4ac4-b647-9d4e565e02fa	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	2	\N	f
522846ec-08d0-4aa6-a82e-e95106030f97	34b57f7b-910f-4ac4-b647-9d4e565e02fa	6ba8b958-628e-424f-8040-49cfaa00985d	0.50	kg	3	\N	f
cb3dc68c-6315-4cd1-a41b-65d890afba4c	34b57f7b-910f-4ac4-b647-9d4e565e02fa	18222ed3-19a9-44d6-a028-e6fb2068136d	4.00	pieces	4	\N	f
d96cb5be-019c-4fe2-afd7-4393af34a833	34b57f7b-910f-4ac4-b647-9d4e565e02fa	176307fa-d193-4222-b90e-3e8b342e651e	0.50	kg	5	\N	f
7a056adf-6ce0-4091-b24c-53748ce38518	b0089c8d-78ab-4e71-ba0e-bd262ba304a1	6ba8b958-628e-424f-8040-49cfaa00985d	25.00	pieces	0	\N	f
d83a08e8-3520-4b10-bb68-178157a0e3ef	d6d0ccc2-7f55-4af7-94b4-2e3d1fa9cd4d	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	0	\N	f
216db9fe-c171-4867-a97e-94aca54b5d19	d6d0ccc2-7f55-4af7-94b4-2e3d1fa9cd4d	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	1	\N	f
24dc1aa6-34bc-4b06-ae63-19d2f82efdda	d6d0ccc2-7f55-4af7-94b4-2e3d1fa9cd4d	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	2	\N	f
36638872-5081-4b2e-bf18-b097353d6957	d6d0ccc2-7f55-4af7-94b4-2e3d1fa9cd4d	075c301f-67e2-4bff-bcc8-2d215fcdf849	1.00	pieces	3	\N	f
86cb22cc-d7d1-4416-921d-aabb9d3d455a	d6d0ccc2-7f55-4af7-94b4-2e3d1fa9cd4d	0da5a062-f5c8-4c88-98af-075e5ab0a509	5.00	pieces	4	\N	f
9a9141cf-1196-463a-b973-e04bdde1f67a	d6d0ccc2-7f55-4af7-94b4-2e3d1fa9cd4d	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2.00	pieces	5	\N	f
5dc62c60-3c05-4593-8ebf-800e7724b9ec	d6d0ccc2-7f55-4af7-94b4-2e3d1fa9cd4d	041ef8f9-ffc1-441d-920b-168d7f2597fd	2.00	pieces	6	\N	f
b0d86f4a-10c0-41e0-a60b-ec6c32ad97ad	d6d0ccc2-7f55-4af7-94b4-2e3d1fa9cd4d	176307fa-d193-4222-b90e-3e8b342e651e	8.00	pieces	7	\N	f
4ea68d39-be47-4f2c-b18f-0bcef9d0fbeb	867d041f-c376-404c-9626-48e14b612edf	041ef8f9-ffc1-441d-920b-168d7f2597fd	6.00	pieces	0	\N	f
674992a9-ae04-4e40-8e32-76a031cc65ad	867d041f-c376-404c-9626-48e14b612edf	f4665f7d-81b6-414d-9cb9-b962febfe50b	18.00	pieces	1	\N	f
83cff429-3e0c-49ba-8c36-300b24cb1ea3	867d041f-c376-404c-9626-48e14b612edf	176307fa-d193-4222-b90e-3e8b342e651e	1.00	kg	2	\N	f
093e51db-c87f-4051-acee-08faa1476e2b	867d041f-c376-404c-9626-48e14b612edf	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	3	\N	f
becc29d0-8f9c-4922-92b5-eae933aaf811	867d041f-c376-404c-9626-48e14b612edf	0da5a062-f5c8-4c88-98af-075e5ab0a509	3.00	kg	4	\N	f
f1466db3-3db0-445d-b95d-ef314977f9b6	867d041f-c376-404c-9626-48e14b612edf	6ba8b958-628e-424f-8040-49cfaa00985d	1.50	kg	5	\N	f
c0ee6348-4c95-48e4-950f-70a4439503b8	867d041f-c376-404c-9626-48e14b612edf	37d66304-d6b6-4261-a065-1be24aeb104b	6.00	pieces	6	\N	f
2c1d41e8-39fb-42e8-89b6-b26fd691761f	867d041f-c376-404c-9626-48e14b612edf	1eea3318-ff50-409d-8759-9645f3aada40	2.00	pieces	7	\N	f
47f459d2-74d0-45fa-8700-b5de1fd20aad	867d041f-c376-404c-9626-48e14b612edf	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	8	\N	f
d23dd069-0e79-4c0e-9c16-651b383ed085	867d041f-c376-404c-9626-48e14b612edf	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	9	\N	f
ef972178-2f48-448b-8c2a-e3cd86bf28cb	867d041f-c376-404c-9626-48e14b612edf	7c5ce30a-c741-40c6-81b6-bd846f705efd	1.00	pieces	10	\N	f
45e14aee-363b-4fe7-b543-815d6e3d62ec	5b225055-a7b4-4141-b208-722fd8d2397c	6ba8b958-628e-424f-8040-49cfaa00985d	5.00	pieces	5	\N	f
d5c62972-a822-4f02-bd04-5ae91eee4708	58179021-c117-4ee6-9838-7d4891892d40	041ef8f9-ffc1-441d-920b-168d7f2597fd	11.00	pieces	5	\N	f
48ba8cbc-d901-4748-b870-a92bc53377e1	58179021-c117-4ee6-9838-7d4891892d40	64f59ccf-be2a-4d15-ab83-94171e69a395	10.00	pieces	6	\N	f
2b801a69-8453-4251-ab10-9488bba02881	58179021-c117-4ee6-9838-7d4891892d40	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	7	\N	f
6cb17307-28cc-4485-86a7-c59a43fbe8a0	58179021-c117-4ee6-9838-7d4891892d40	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	8	\N	f
293fdf79-68f8-4a7b-bf53-4fc16e1fba51	58179021-c117-4ee6-9838-7d4891892d40	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	9	\N	f
54d5c499-f699-4001-a9e3-7a37d0122861	58179021-c117-4ee6-9838-7d4891892d40	35c51dce-046e-41b8-abf8-df9b318116f7	2.00	pieces	10	\N	f
6bcbaf98-48f8-4dc1-aaac-1f7ffbab3aa1	58179021-c117-4ee6-9838-7d4891892d40	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	10.00	pieces	11	\N	f
2aa0cc21-b328-4ff7-b9c3-f073321d0f0c	58179021-c117-4ee6-9838-7d4891892d40	7c5ce30a-c741-40c6-81b6-bd846f705efd	10.00	pieces	12	\N	f
4c93c3f4-9f9c-4524-b2bb-c2bfc6d783ef	58179021-c117-4ee6-9838-7d4891892d40	34e7679d-b1d8-40b2-8359-be4a30e1a981	10.00	pieces	13	\N	f
9e0a6da0-d409-423b-86ec-cf243afaf088	58179021-c117-4ee6-9838-7d4891892d40	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	14	\N	f
a39b4670-b0b3-494a-8b4d-0ee7c0054143	5b225055-a7b4-4141-b208-722fd8d2397c	64f59ccf-be2a-4d15-ab83-94171e69a395	5.00	pieces	6	\N	f
1110cf1a-a323-4ab1-87be-ec7dc820612b	5b225055-a7b4-4141-b208-722fd8d2397c	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	7	\N	f
637da426-7f83-4ac0-8ebc-6300dff873bc	5b225055-a7b4-4141-b208-722fd8d2397c	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	8	\N	f
e132addd-1275-4fe1-ae89-b1ef14569d90	9794474d-64fa-480c-b24a-8cd4cb8ea648	4e3e47a9-131c-4351-ac41-1bafd8c657ce	4.00	pieces	0	\N	f
169f948c-2eee-4ff0-88c4-5e3942a01ac9	9794474d-64fa-480c-b24a-8cd4cb8ea648	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	3.00	pieces	1	\N	f
b60392e1-d9ba-480d-b2df-6b88ba2648e6	9794474d-64fa-480c-b24a-8cd4cb8ea648	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	2	\N	f
b56639f7-c3d2-44de-aaab-772ad0bc103b	5b225055-a7b4-4141-b208-722fd8d2397c	075c301f-67e2-4bff-bcc8-2d215fcdf849	1.00	pieces	9	\N	f
fd8f43ec-61cd-4d10-a572-53047f32c171	5b225055-a7b4-4141-b208-722fd8d2397c	4e3e47a9-131c-4351-ac41-1bafd8c657ce	2.00	pieces	10	\N	f
111ded6d-c02e-47d4-8a42-1c181bce440b	5b225055-a7b4-4141-b208-722fd8d2397c	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	11	\N	f
a7178d93-3e7a-4576-8f1a-bd3d9600f626	544f098f-2d10-4bb1-9140-0977c35df94c	8480b77a-07cd-4b5d-8769-2af7e717b684	8.00	pieces	0	\N	f
adaab829-34a5-4197-a2ae-eff376e8c5aa	544f098f-2d10-4bb1-9140-0977c35df94c	18222ed3-19a9-44d6-a028-e6fb2068136d	10.00	pieces	1	\N	f
a99d0d50-c469-4435-8181-c0a80b8f2e63	544f098f-2d10-4bb1-9140-0977c35df94c	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	2	\N	f
283a8fad-2f97-44ad-b43f-8d4b2087e0bc	544f098f-2d10-4bb1-9140-0977c35df94c	041ef8f9-ffc1-441d-920b-168d7f2597fd	15.00	pieces	3	\N	f
bcb65571-58f5-4f79-9155-fe07316d513e	544f098f-2d10-4bb1-9140-0977c35df94c	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	4	\N	f
caaa0c98-5170-461d-b9fc-13e2cb98e69a	544f098f-2d10-4bb1-9140-0977c35df94c	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	5.00	pieces	5	\N	f
46c2b4bf-94f4-4f84-9fbb-6c013a2fb596	544f098f-2d10-4bb1-9140-0977c35df94c	64f59ccf-be2a-4d15-ab83-94171e69a395	14.00	pieces	6	\N	f
2f29a9e1-f19b-49f2-833e-7061f77e3aa9	544f098f-2d10-4bb1-9140-0977c35df94c	973d147d-0217-41bf-bec2-ab39f80af20c	10.00	pieces	7	\N	f
09d63613-458a-44c6-8fff-28e4f3b5e65e	544f098f-2d10-4bb1-9140-0977c35df94c	feebdc41-9a89-4de4-8860-6c06c81c002a	5.00	pieces	8	\N	f
4154931b-cdd1-428d-8273-b0289fdca417	544f098f-2d10-4bb1-9140-0977c35df94c	075c301f-67e2-4bff-bcc8-2d215fcdf849	60.00	pieces	9	\N	f
8b15fd01-2603-4724-b252-96ef5a7a0155	544f098f-2d10-4bb1-9140-0977c35df94c	74545d89-0336-41f8-b100-6b1a2c8cf381	7.00	pieces	10	\N	f
d0549df4-136b-48f5-be54-e25ec093c791	544f098f-2d10-4bb1-9140-0977c35df94c	6c7dda60-2444-4ee0-8eb0-5a30ea2ccbca	1.00	pieces	11	\N	f
05464dfa-b42f-46e7-a605-a43e4f767d22	301b36da-7899-47d1-97b3-ff15e4dae8fd	18222ed3-19a9-44d6-a028-e6fb2068136d	2.00	pieces	0	\N	f
b97c2362-2642-4f81-b5ab-d38240225f83	301b36da-7899-47d1-97b3-ff15e4dae8fd	6ba8b958-628e-424f-8040-49cfaa00985d	0.50	kg	1	\N	f
b32d2842-b334-490e-88d9-4a2abd8b125f	301b36da-7899-47d1-97b3-ff15e4dae8fd	176307fa-d193-4222-b90e-3e8b342e651e	0.50	kg	2	\N	f
101e4b44-7210-4148-afd9-e31dd56a3ff5	301b36da-7899-47d1-97b3-ff15e4dae8fd	25149783-1d1a-4449-b54a-1068ca3405ba	1.00	pieces	3	\N	f
66e385b0-46c0-4de8-8c4e-4d4881ac0f80	301b36da-7899-47d1-97b3-ff15e4dae8fd	075c301f-67e2-4bff-bcc8-2d215fcdf849	2.00	pieces	4	\N	f
22c69163-79d0-4a03-b093-72459471a417	0ff9cddf-ac64-4d61-9a4c-590089a1f526	041ef8f9-ffc1-441d-920b-168d7f2597fd	35.00	pieces	0	\N	f
d6c32d8e-374a-4928-ba2c-7403c446be51	0ff9cddf-ac64-4d61-9a4c-590089a1f526	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	25.00	pieces	1	\N	f
d10722ed-3607-498f-a94e-e140fcd6e75b	0ff9cddf-ac64-4d61-9a4c-590089a1f526	74545d89-0336-41f8-b100-6b1a2c8cf381	4.00	pieces	2	\N	f
c2944d3a-a1fc-4718-aeb3-7a7723652981	0ff9cddf-ac64-4d61-9a4c-590089a1f526	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	4.00	pieces	3	\N	f
ed317480-4980-45ac-8f29-3c9946563f97	0ff9cddf-ac64-4d61-9a4c-590089a1f526	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	4	\N	f
9845a456-0f64-49b2-877d-549e3fd3feff	0ff9cddf-ac64-4d61-9a4c-590089a1f526	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	10.00	pieces	5	\N	f
319da979-c147-4e7a-9004-5fda13c9c0bc	0ff9cddf-ac64-4d61-9a4c-590089a1f526	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	6	\N	f
619e624e-641f-4bd3-b3bb-efbcb6385915	0ff9cddf-ac64-4d61-9a4c-590089a1f526	35c51dce-046e-41b8-abf8-df9b318116f7	4.00	pieces	7	\N	f
65bd4acc-1cbe-4bcb-be53-bf6b43c74755	0ff9cddf-ac64-4d61-9a4c-590089a1f526	e76dcae7-c72d-4957-9aa7-d627003e5bb2	15.00	pieces	8	\N	f
daef4e39-b272-442c-a355-c733ebba1780	0ff9cddf-ac64-4d61-9a4c-590089a1f526	94610731-af1b-4ecf-bee2-4c37feee8f1d	10.00	pieces	9	\N	f
44c469ce-83d3-44ef-b1a5-41e761394f78	0ff9cddf-ac64-4d61-9a4c-590089a1f526	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	8.00	pieces	10	\N	f
e245f659-a418-470d-b96c-77ea30b969c2	0ff9cddf-ac64-4d61-9a4c-590089a1f526	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	11	\N	f
bef71876-d0a3-471d-8014-b7549c505385	0ff9cddf-ac64-4d61-9a4c-590089a1f526	176307fa-d193-4222-b90e-3e8b342e651e	120.00	pieces	12	\N	f
19149868-387b-4b03-a14f-00cfba327dc9	0ff9cddf-ac64-4d61-9a4c-590089a1f526	0da5a062-f5c8-4c88-98af-075e5ab0a509	14.00	pieces	13	\N	f
b9eaff73-297a-45b6-9218-6ebaec897452	0ff9cddf-ac64-4d61-9a4c-590089a1f526	64f59ccf-be2a-4d15-ab83-94171e69a395	15.00	pieces	14	\N	f
5bfbb63a-cb32-48bc-bee7-199857925952	0ff9cddf-ac64-4d61-9a4c-590089a1f526	6ba8b958-628e-424f-8040-49cfaa00985d	20.00	pieces	15	\N	f
51666966-8a4a-44e3-848e-770bd0f05787	0ff9cddf-ac64-4d61-9a4c-590089a1f526	18222ed3-19a9-44d6-a028-e6fb2068136d	16.00	pieces	16	\N	f
300ad2ba-2b11-4ccb-8e76-6ea689a23ab4	0ff9cddf-ac64-4d61-9a4c-590089a1f526	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	18.00	pieces	17	\N	f
ff159380-0b96-4525-aaff-e765b436b483	0ff9cddf-ac64-4d61-9a4c-590089a1f526	feebdc41-9a89-4de4-8860-6c06c81c002a	2.00	pieces	18	\N	f
b225a882-5de5-47c3-8e0f-2db307eb072a	0ff9cddf-ac64-4d61-9a4c-590089a1f526	075c301f-67e2-4bff-bcc8-2d215fcdf849	20.00	pieces	19	\N	f
e3b0eed1-3bb0-4679-aac0-cda1399f6fad	0ff9cddf-ac64-4d61-9a4c-590089a1f526	973d147d-0217-41bf-bec2-ab39f80af20c	6.00	pieces	20	\N	f
dbd48e17-a4c1-44ee-a476-3d26b032aa3c	0ff9cddf-ac64-4d61-9a4c-590089a1f526	25149783-1d1a-4449-b54a-1068ca3405ba	2.00	pieces	21	\N	f
945ab7b5-585c-4930-aaf3-85be5f02997b	0ff9cddf-ac64-4d61-9a4c-590089a1f526	fbc92d53-9184-48c5-8fb6-08eb94762912	5.00	pieces	22	\N	f
61894aec-b753-421a-be02-550880aa4954	0ff9cddf-ac64-4d61-9a4c-590089a1f526	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.00	pieces	23	\N	f
c3f7ca32-e68c-44f2-bc08-4fda86e90e4d	0ff9cddf-ac64-4d61-9a4c-590089a1f526	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	24	\N	f
e7ad88a4-edf1-4afc-8b11-82b40eedb0a4	0ff9cddf-ac64-4d61-9a4c-590089a1f526	f9008beb-4663-4ceb-bd05-eefff8739259	1.00	pieces	25	\N	f
dc45bd4f-41d7-49b1-bebd-fc0c4fe860bc	0ff9cddf-ac64-4d61-9a4c-590089a1f526	1eea3318-ff50-409d-8759-9645f3aada40	6.00	pieces	26	\N	f
1c20bdb6-45ad-4240-b805-32e2ada7d2e7	0ff9cddf-ac64-4d61-9a4c-590089a1f526	4e3e47a9-131c-4351-ac41-1bafd8c657ce	10.00	pieces	27	\N	f
2f5ab5d4-4b46-4cf0-afef-09fdb485324a	0ff9cddf-ac64-4d61-9a4c-590089a1f526	7c5ce30a-c741-40c6-81b6-bd846f705efd	4.00	pieces	28	\N	f
7a482f4a-b743-4b63-ba8c-25cfe3c01525	0ff9cddf-ac64-4d61-9a4c-590089a1f526	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	4.00	pieces	29	\N	f
be524f3c-de3d-4602-92c8-c61ae2e917d9	544f098f-2d10-4bb1-9140-0977c35df94c	0a945f63-467f-441c-8fa6-4d56197494c4	1.00	pieces	12	\N	f
07e66c5a-df89-4ab8-a36a-aeba80ac52c7	544f098f-2d10-4bb1-9140-0977c35df94c	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	2.50	pieces	13	\N	f
949cafe5-7f1d-45f7-8778-a9b9292a1cb0	544f098f-2d10-4bb1-9140-0977c35df94c	43620106-1595-430e-b31d-a30a17304cec	0.50	pieces	14	\N	f
77685830-b0f8-4dae-8f9d-fa6661105eb3	544f098f-2d10-4bb1-9140-0977c35df94c	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.50	pieces	15	\N	f
156c3a37-b45f-46a1-93d5-4afaf0cab0a5	544f098f-2d10-4bb1-9140-0977c35df94c	c6dfabb9-0bb9-4e18-b26d-403b7a611852	0.50	pieces	16	\N	f
3c128087-3c2d-4c66-a072-2d36fb81e036	544f098f-2d10-4bb1-9140-0977c35df94c	f9008beb-4663-4ceb-bd05-eefff8739259	1.00	pieces	17	\N	f
9f896d02-1ba9-445f-958d-cf5a749f67bf	544f098f-2d10-4bb1-9140-0977c35df94c	4e3e47a9-131c-4351-ac41-1bafd8c657ce	4.00	pieces	18	\N	f
307348ab-dacc-47b5-9135-738b874d4dc9	544f098f-2d10-4bb1-9140-0977c35df94c	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	19	\N	f
b31ed143-4376-4cac-af75-e5794815fd5b	544f098f-2d10-4bb1-9140-0977c35df94c	34e7679d-b1d8-40b2-8359-be4a30e1a981	5.00	pieces	20	\N	f
2efc927b-8621-4aab-a647-a3e7ed706eb1	5c591444-60c0-4a9d-9c71-d1646ed83fec	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	0	\N	f
5c03943e-977c-4365-8862-f16a771b1f5d	5c591444-60c0-4a9d-9c71-d1646ed83fec	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	1	\N	f
2d5f07ff-5672-4d7d-aebf-4f5e18b117a7	5c591444-60c0-4a9d-9c71-d1646ed83fec	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	2	\N	f
71c20e1b-2943-4d60-93fa-f0ddb5826bee	5c591444-60c0-4a9d-9c71-d1646ed83fec	075c301f-67e2-4bff-bcc8-2d215fcdf849	1.00	pieces	3	\N	f
bae60e80-719f-404d-b82d-d43f6b93c3b8	5c591444-60c0-4a9d-9c71-d1646ed83fec	973d147d-0217-41bf-bec2-ab39f80af20c	1.00	pieces	4	\N	f
b65c5a9d-f775-423c-8596-870566d02096	5c591444-60c0-4a9d-9c71-d1646ed83fec	0da5a062-f5c8-4c88-98af-075e5ab0a509	10.00	pieces	5	\N	f
8018c765-7e31-4e8d-afaa-6837ad8e888f	5c591444-60c0-4a9d-9c71-d1646ed83fec	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2.00	pieces	6	\N	f
c1224547-c892-4196-9f07-a4495f258355	5c591444-60c0-4a9d-9c71-d1646ed83fec	041ef8f9-ffc1-441d-920b-168d7f2597fd	4.00	pieces	7	\N	f
92fcc419-797d-4725-828b-5fd2ef64bb90	5c591444-60c0-4a9d-9c71-d1646ed83fec	176307fa-d193-4222-b90e-3e8b342e651e	15.00	pieces	8	\N	f
150f40a4-4ee7-400f-8740-4aaeb36b00bd	ea650b98-0375-494d-8f7c-18730577573a	176307fa-d193-4222-b90e-3e8b342e651e	2.50	kg	0	\N	f
35b52750-1590-4dd7-9cd1-35fbece07d99	ea650b98-0375-494d-8f7c-18730577573a	37d66304-d6b6-4261-a065-1be24aeb104b	25.00	pieces	1	\N	f
65a1aaa7-4664-451f-9bdb-e114af6b9e42	ea650b98-0375-494d-8f7c-18730577573a	4c964f81-b74d-4fe8-a53a-e0491645336b	20.00	pieces	2	\N	f
33445b52-677e-4c5e-8bc7-84e7bfe8ea16	ea650b98-0375-494d-8f7c-18730577573a	e76dcae7-c72d-4957-9aa7-d627003e5bb2	10.00	pieces	3	\N	f
66ce8c38-1c9e-4d93-82c2-298b14b24df7	ea650b98-0375-494d-8f7c-18730577573a	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	4	\N	f
073ccf28-18af-47f5-bddf-0360767c19a9	abc3499a-40d9-42a3-b123-2de64c3b7765	35c51dce-046e-41b8-abf8-df9b318116f7	2.00	pieces	0	\N	f
05c94682-1adb-483b-bca4-679d3dd284f6	abc3499a-40d9-42a3-b123-2de64c3b7765	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	1	\N	f
c53c5066-1941-42f0-aff1-4e63aa074acd	abc3499a-40d9-42a3-b123-2de64c3b7765	94610731-af1b-4ecf-bee2-4c37feee8f1d	12.00	pieces	2	\N	f
137d0bf4-f1fe-4dd6-8afb-b359e6672d9f	abc3499a-40d9-42a3-b123-2de64c3b7765	f4665f7d-81b6-414d-9cb9-b962febfe50b	24.00	pieces	3	\N	f
40fdf76f-70c7-4b59-9e08-3f1a2eda6db6	abc3499a-40d9-42a3-b123-2de64c3b7765	92820156-5037-4459-b7b6-8344ffabfd0d	1.00	kg	4	\N	f
1bd15d85-5e72-48af-affb-9ffb43e8ac45	abc3499a-40d9-42a3-b123-2de64c3b7765	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.50	kg	5	\N	f
53ff4a2c-003a-45bc-b783-4dbc5bb8db13	abc3499a-40d9-42a3-b123-2de64c3b7765	18222ed3-19a9-44d6-a028-e6fb2068136d	6.00	pieces	6	\N	f
6765005f-b296-49f7-a148-8386fbc9ce4a	abc3499a-40d9-42a3-b123-2de64c3b7765	0da5a062-f5c8-4c88-98af-075e5ab0a509	4.00	kg	7	\N	f
3342e2fe-4584-45e3-baf1-c1a48bdbfa44	ea650b98-0375-494d-8f7c-18730577573a	041ef8f9-ffc1-441d-920b-168d7f2597fd	46.00	pieces	5	\N	f
15efa073-bc00-452c-9efb-40259d398fd2	ea650b98-0375-494d-8f7c-18730577573a	18222ed3-19a9-44d6-a028-e6fb2068136d	3.00	pieces	6	\N	f
ffd7cb73-0c24-4745-be1f-4c9dc4ae8bbd	ea650b98-0375-494d-8f7c-18730577573a	92820156-5037-4459-b7b6-8344ffabfd0d	30.00	pieces	7	\N	f
82e515d1-8b48-4aaf-b1ff-b799331291fe	ea650b98-0375-494d-8f7c-18730577573a	74545d89-0336-41f8-b100-6b1a2c8cf381	1.00	pieces	8	\N	f
986f32f2-d8ec-4cb2-b632-2ef620a602ad	ea650b98-0375-494d-8f7c-18730577573a	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	9	\N	f
74cdb9a7-e725-431c-9117-9fa000537491	ea650b98-0375-494d-8f7c-18730577573a	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	10	\N	f
63c7f0e8-8625-4e3a-9cdd-a5ad35804304	ea650b98-0375-494d-8f7c-18730577573a	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	11	\N	f
60bdcd90-855b-40b4-9df2-68ff16884317	86a76dab-bf20-4217-81c5-b438c24ae953	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	5.00	pieces	0	\N	f
c4d8d5c5-595f-40df-8e51-d28ae6f914a2	86a76dab-bf20-4217-81c5-b438c24ae953	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	16.00	pieces	1	\N	f
b2741d2e-5402-4b9a-89f1-c45348b92097	86a76dab-bf20-4217-81c5-b438c24ae953	0da5a062-f5c8-4c88-98af-075e5ab0a509	1.00	kg	2	\N	f
37bc41cc-cc6e-4274-8525-5754f95538bf	cf360098-ae45-4da7-b6af-81531f68218f	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	1.00	pieces	0	\N	f
17cbe015-6a52-40bc-a4ed-84faddf66c27	cf360098-ae45-4da7-b6af-81531f68218f	6ba8b958-628e-424f-8040-49cfaa00985d	10.00	pieces	1	\N	f
77738a41-765c-436b-ba98-6eeb7eca1dd5	abc3499a-40d9-42a3-b123-2de64c3b7765	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	8	\N	f
1a31bb4b-d291-44b2-9201-a8e7b8f2b8d0	abc3499a-40d9-42a3-b123-2de64c3b7765	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	8.00	pieces	9	\N	f
1f1d3cc8-e734-4a0e-8db7-60f6f41480d2	abc3499a-40d9-42a3-b123-2de64c3b7765	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	10	\N	f
8584f7e2-b3b1-4e74-995b-fde1416e37b0	abc3499a-40d9-42a3-b123-2de64c3b7765	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	11	\N	f
7eb30700-57bf-4d9e-b149-c2b32a0f2e46	abc3499a-40d9-42a3-b123-2de64c3b7765	620723fb-8ddc-43c6-b1b8-24a471d05dd3	2.00	pieces	12	\N	f
91999120-3a2e-4551-a502-ab1cd17f1d7a	23e9521a-57a2-4cd5-8a2f-ca97f35da394	7c5ce30a-c741-40c6-81b6-bd846f705efd	3.00	pieces	0	\N	f
cfc71d75-e26f-4687-8ee5-f4140ffb5a70	23e9521a-57a2-4cd5-8a2f-ca97f35da394	34e7679d-b1d8-40b2-8359-be4a30e1a981	3.00	pieces	1	\N	f
96738b4a-036d-4449-bdf5-79799dfcc5ef	5a402df6-a3f6-44dd-88ca-2c47d789525c	7c5ce30a-c741-40c6-81b6-bd846f705efd	4.00	pieces	0	\N	f
d154fa21-06e5-4ec3-8a3d-422394ac9ea9	abc3499a-40d9-42a3-b123-2de64c3b7765	075c301f-67e2-4bff-bcc8-2d215fcdf849	4.00	pieces	13	\N	f
8b3ba9ab-03c1-4656-ab22-cc7a2bffd72a	ef3aa308-7ced-4bbe-9974-e131e842639a	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	0	\N	f
43695a7a-1c43-4713-87d1-e6eca143ce1e	ef3aa308-7ced-4bbe-9974-e131e842639a	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	3.00	pieces	1	\N	f
d556e11a-9495-414e-859e-831722f3c327	cabd7953-c6b2-4085-84df-7312520977bb	041ef8f9-ffc1-441d-920b-168d7f2597fd	2.50	kg	0	\N	f
a67a4c24-b602-4df9-b9d8-06244c7fcc94	cabd7953-c6b2-4085-84df-7312520977bb	176307fa-d193-4222-b90e-3e8b342e651e	2.00	kg	1	\N	f
9a2a1151-ea79-4ac8-b11f-ba730a8e4c27	cabd7953-c6b2-4085-84df-7312520977bb	0da5a062-f5c8-4c88-98af-075e5ab0a509	4.00	kg	2	\N	f
2e2add5f-1f77-4bda-ad8a-5da6023f047a	cabd7953-c6b2-4085-84df-7312520977bb	92820156-5037-4459-b7b6-8344ffabfd0d	4.00	kg	3	\N	f
3194ce97-5c0e-4d69-8f35-b4a84966147d	cabd7953-c6b2-4085-84df-7312520977bb	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	6.00	pieces	4	\N	f
7e2b7284-da6f-4b16-a291-408108833848	cabd7953-c6b2-4085-84df-7312520977bb	35c51dce-046e-41b8-abf8-df9b318116f7	8.00	pieces	5	\N	f
cda5b537-0297-4f4b-9714-8dd97c028d9c	cabd7953-c6b2-4085-84df-7312520977bb	e76dcae7-c72d-4957-9aa7-d627003e5bb2	1.50	kg	6	\N	f
84941c4b-736e-432d-a17f-3540a9582edf	cabd7953-c6b2-4085-84df-7312520977bb	970e4480-02e3-4088-b77a-8a0e74c85886	2.00	pieces	7	\N	f
bb83f072-f159-4aa9-8859-01871946fdf9	cabd7953-c6b2-4085-84df-7312520977bb	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	8.00	pieces	8	\N	f
2f453b80-e87e-4077-af44-4b147a20d9b6	cabd7953-c6b2-4085-84df-7312520977bb	620723fb-8ddc-43c6-b1b8-24a471d05dd3	8.00	pieces	9	\N	f
4562c810-382d-4144-b947-0e113e1b940c	cabd7953-c6b2-4085-84df-7312520977bb	74545d89-0336-41f8-b100-6b1a2c8cf381	12.00	pieces	10	\N	f
a2008087-5371-4a50-8168-15c8eb0ee564	cabd7953-c6b2-4085-84df-7312520977bb	feebdc41-9a89-4de4-8860-6c06c81c002a	4.00	pieces	11	\N	f
dd6d5925-278b-4150-a7f4-837695475f8f	cabd7953-c6b2-4085-84df-7312520977bb	075c301f-67e2-4bff-bcc8-2d215fcdf849	6.00	pieces	12	\N	f
6a85f7b8-2704-415f-b20f-e032b42fefa5	cabd7953-c6b2-4085-84df-7312520977bb	8b4a2f78-50b8-4374-a55b-a01b7aea7341	3.00	pieces	13	\N	f
4933781e-7f92-4a4b-846a-66a20accddec	cabd7953-c6b2-4085-84df-7312520977bb	725caca3-1174-4f0e-8374-d00465cc932d	3.00	pieces	14	\N	f
4c73f288-5744-46b0-8983-52ed35b7ce7a	cabd7953-c6b2-4085-84df-7312520977bb	4e3e47a9-131c-4351-ac41-1bafd8c657ce	6.00	pieces	15	\N	f
61dc4e25-fe5d-44dc-b423-5762f4dbbc2e	cabd7953-c6b2-4085-84df-7312520977bb	7c5ce30a-c741-40c6-81b6-bd846f705efd	4.00	pieces	16	\N	f
ee5403f4-7670-4f34-8a40-3b2191d53c9e	cabd7953-c6b2-4085-84df-7312520977bb	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	4.00	pieces	17	\N	f
057e92eb-d172-4910-890a-2d8c66caba11	cabd7953-c6b2-4085-84df-7312520977bb	34e7679d-b1d8-40b2-8359-be4a30e1a981	8.00	pieces	18	\N	f
929ec1f2-ed0b-4288-9bf6-1c6c4f57971d	abc3499a-40d9-42a3-b123-2de64c3b7765	25149783-1d1a-4449-b54a-1068ca3405ba	1.00	pieces	14	\N	f
d778fef4-902e-4927-87c6-1b52a9a82b68	abc3499a-40d9-42a3-b123-2de64c3b7765	feebdc41-9a89-4de4-8860-6c06c81c002a	1.00	pieces	15	\N	f
9ecf3592-0293-4716-a499-7c433b9b3be7	abc3499a-40d9-42a3-b123-2de64c3b7765	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	4.00	pieces	16	\N	f
1eb5a955-d859-4b7f-84fe-f49f64750ff3	ba7cd36d-f648-4020-be65-a6f832bb70a3	d4ff9cf3-4e81-4315-90e6-eb602a136a0a	3.00	pieces	18	\N	f
59ef7839-4575-48f8-a434-b73c1978fe37	8e842d94-c4eb-4d3f-a033-183c1a5513ba	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	1.00	kg	0	\N	f
f23a6d40-b7dc-490a-b128-c84955980080	8e842d94-c4eb-4d3f-a033-183c1a5513ba	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	1.00	kg	1	\N	f
1c010bed-c778-4605-a892-ee8a013bf522	8e842d94-c4eb-4d3f-a033-183c1a5513ba	35c51dce-046e-41b8-abf8-df9b318116f7	5.00	pieces	2	\N	f
349d19d8-92c9-41ab-8c37-859eb0f674cd	8e842d94-c4eb-4d3f-a033-183c1a5513ba	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	10.00	pieces	3	\N	f
e35a8dc7-4f7d-403b-83e2-59b50be21e65	8e842d94-c4eb-4d3f-a033-183c1a5513ba	0da5a062-f5c8-4c88-98af-075e5ab0a509	6.00	kg	4	\N	f
eb630dc0-c31f-4e6b-ba24-c86bd97f4a08	8e842d94-c4eb-4d3f-a033-183c1a5513ba	6ba8b958-628e-424f-8040-49cfaa00985d	4.00	kg	5	\N	f
b9835b5a-97f5-4c0a-95f1-e86eeaefa1ab	8e842d94-c4eb-4d3f-a033-183c1a5513ba	64f59ccf-be2a-4d15-ab83-94171e69a395	4.00	kg	6	\N	f
9d1bfd6a-5e59-419e-a30c-d4462964ba45	8e842d94-c4eb-4d3f-a033-183c1a5513ba	92820156-5037-4459-b7b6-8344ffabfd0d	5.00	kg	7	\N	f
07e6fda8-6acc-4ec1-b3df-2bf187b180a8	8e842d94-c4eb-4d3f-a033-183c1a5513ba	041ef8f9-ffc1-441d-920b-168d7f2597fd	5.00	kg	8	\N	f
24302975-5a56-4cb1-b29c-97749fd1585b	8e842d94-c4eb-4d3f-a033-183c1a5513ba	e76dcae7-c72d-4957-9aa7-d627003e5bb2	1.50	kg	9	\N	f
eb82afbe-a779-4431-b8af-da5f18805a89	8e842d94-c4eb-4d3f-a033-183c1a5513ba	94610731-af1b-4ecf-bee2-4c37feee8f1d	1.50	kg	10	\N	f
a193c6ce-febd-4dbc-b263-99be99af0b7c	8e842d94-c4eb-4d3f-a033-183c1a5513ba	f4665f7d-81b6-414d-9cb9-b962febfe50b	2.00	kg	11	\N	f
3902c421-ad16-4a16-8591-9ad8290ecb8e	8e842d94-c4eb-4d3f-a033-183c1a5513ba	176307fa-d193-4222-b90e-3e8b342e651e	6.00	kg	12	\N	f
5d99fc5d-a5fe-4e1e-ae21-549e6ab7fcd0	8e842d94-c4eb-4d3f-a033-183c1a5513ba	18222ed3-19a9-44d6-a028-e6fb2068136d	20.00	pieces	13	\N	f
0883f278-c9c5-43c3-b439-dcc9d9e79c71	8e842d94-c4eb-4d3f-a033-183c1a5513ba	8480b77a-07cd-4b5d-8769-2af7e717b684	6.00	pieces	14	\N	f
3400b4fc-f75a-4364-98da-9bd25013cadd	8e842d94-c4eb-4d3f-a033-183c1a5513ba	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	40.00	pieces	15	\N	f
2e3db790-440f-42da-9bf0-b825690b633a	8e842d94-c4eb-4d3f-a033-183c1a5513ba	74545d89-0336-41f8-b100-6b1a2c8cf381	20.00	pieces	16	\N	f
4a844be4-dfd8-4828-9a43-d865f469562a	8e842d94-c4eb-4d3f-a033-183c1a5513ba	620723fb-8ddc-43c6-b1b8-24a471d05dd3	3.00	pieces	17	\N	f
2625f954-b67c-46a9-9721-53dc424cb4d6	8e842d94-c4eb-4d3f-a033-183c1a5513ba	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	15.00	pieces	18	\N	f
9d663815-61cc-4b6b-9d97-5935df5516e2	8e842d94-c4eb-4d3f-a033-183c1a5513ba	25149783-1d1a-4449-b54a-1068ca3405ba	6.00	pieces	19	\N	f
34f50ee0-ead4-4f85-b413-880d16db8d66	8e842d94-c4eb-4d3f-a033-183c1a5513ba	075c301f-67e2-4bff-bcc8-2d215fcdf849	40.00	pieces	20	\N	f
5d5956b6-9495-43a3-8bb2-429567d812ff	8e842d94-c4eb-4d3f-a033-183c1a5513ba	973d147d-0217-41bf-bec2-ab39f80af20c	18.00	pieces	21	\N	f
4616a68f-ff3c-4767-8402-52863bb62f6d	8e842d94-c4eb-4d3f-a033-183c1a5513ba	feebdc41-9a89-4de4-8860-6c06c81c002a	4.00	pieces	22	\N	f
84cd8022-8950-47cd-8145-55ef6d66d620	8e842d94-c4eb-4d3f-a033-183c1a5513ba	8b4a2f78-50b8-4374-a55b-a01b7aea7341	6.00	pieces	23	\N	f
38a80f91-91cb-4b15-9fcb-d5211fef346d	8e842d94-c4eb-4d3f-a033-183c1a5513ba	725caca3-1174-4f0e-8374-d00465cc932d	2.00	pieces	24	\N	f
1198c303-574d-41a6-8933-344cfffd6b80	8e842d94-c4eb-4d3f-a033-183c1a5513ba	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	15.00	pieces	25	\N	f
34c28e77-32f5-4d86-9a42-5f69a5119404	8e842d94-c4eb-4d3f-a033-183c1a5513ba	e4d79a03-d550-440a-84e0-cb87a56de8a3	2.00	pieces	26	\N	f
51845a68-0e0b-4845-a532-2fe4e49bc7a3	8e842d94-c4eb-4d3f-a033-183c1a5513ba	fbc92d53-9184-48c5-8fb6-08eb94762912	5.00	pieces	27	\N	f
0307a2ec-6c7a-4a83-81b3-78ca4a684624	8e842d94-c4eb-4d3f-a033-183c1a5513ba	8b601429-3aa0-409c-adce-9c42a6d25736	4.00	pieces	28	\N	f
1a18b1fa-70bb-4f88-898c-e8639fe1f7bf	8e842d94-c4eb-4d3f-a033-183c1a5513ba	a62fef1f-06a6-483c-b784-f90780697743	8.00	pieces	29	\N	f
68508c4c-1c58-4841-a1b3-4bbcedcd7fe1	8e842d94-c4eb-4d3f-a033-183c1a5513ba	d6939926-e956-4295-96de-573dff94f2b2	4.00	pieces	30	\N	f
1390ac95-4399-4231-83c9-398b16432f39	8e842d94-c4eb-4d3f-a033-183c1a5513ba	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	2.00	pieces	31	\N	f
68c86d82-8dbd-44fa-91d3-b2393683c73f	8e842d94-c4eb-4d3f-a033-183c1a5513ba	43620106-1595-430e-b31d-a30a17304cec	1.00	pieces	32	\N	f
fc042968-7538-409e-91da-7ef5ca91197b	8e842d94-c4eb-4d3f-a033-183c1a5513ba	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	3.00	pieces	33	\N	f
5732a095-d6ee-4b87-b9ca-c1b9567ef483	8e842d94-c4eb-4d3f-a033-183c1a5513ba	5a4efa43-c1c3-4a3f-96b6-748a2eecbec5	1.00	pieces	34	\N	f
9d9cfb75-ac8e-42e0-b3d8-534f076bacf1	8e842d94-c4eb-4d3f-a033-183c1a5513ba	f9008beb-4663-4ceb-bd05-eefff8739259	3.00	pieces	35	\N	f
2b9212f0-32da-4a4e-8934-b0488556883a	8e842d94-c4eb-4d3f-a033-183c1a5513ba	4e3e47a9-131c-4351-ac41-1bafd8c657ce	24.00	pieces	36	\N	f
3d0e238d-a850-400b-a01b-b7b0a2a09d58	8e842d94-c4eb-4d3f-a033-183c1a5513ba	7c5ce30a-c741-40c6-81b6-bd846f705efd	12.00	pieces	37	\N	f
5ff99911-babd-4b9e-8388-0cdfaa7a3c65	8e842d94-c4eb-4d3f-a033-183c1a5513ba	34e7679d-b1d8-40b2-8359-be4a30e1a981	36.00	pieces	38	\N	f
21de14a1-c834-4680-82f1-ab66a52cf529	ef3aa308-7ced-4bbe-9974-e131e842639a	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	2	\N	f
568e1742-4eb8-4fe2-85b2-9dcedbc455aa	3178f5c4-01be-42ab-843b-4e922a6dbcb9	4e3e47a9-131c-4351-ac41-1bafd8c657ce	4.00	pieces	0	\N	f
8e8dcae0-ba68-4867-bcfc-985295db118e	3178f5c4-01be-42ab-843b-4e922a6dbcb9	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	4.00	pieces	1	\N	f
a9a62531-9555-4c7c-ab40-c26b74c74767	3178f5c4-01be-42ab-843b-4e922a6dbcb9	7c5ce30a-c741-40c6-81b6-bd846f705efd	2.00	pieces	2	\N	f
d3f1cfbf-954f-44f0-818c-72b5ed4d4d26	8217a681-d6ef-470d-90b6-3a193ec19dd0	4e3e47a9-131c-4351-ac41-1bafd8c657ce	2.00	pieces	0	\N	f
3d24fabd-15dd-4aa1-9397-96a93472a167	8217a681-d6ef-470d-90b6-3a193ec19dd0	34e7679d-b1d8-40b2-8359-be4a30e1a981	2.00	pieces	1	\N	f
a4c79881-fa2a-4514-baed-65e0d6a00411	b38f6af7-3732-4908-9770-2ec9add01ef6	92820156-5037-4459-b7b6-8344ffabfd0d	2.00	kg	0	\N	f
171c2609-56a5-4d58-a557-1995317d6c85	b38f6af7-3732-4908-9770-2ec9add01ef6	f4665f7d-81b6-414d-9cb9-b962febfe50b	20.00	pieces	1	\N	f
2c5ab08b-997d-4597-9238-9bc8b9fee4c1	b38f6af7-3732-4908-9770-2ec9add01ef6	64f59ccf-be2a-4d15-ab83-94171e69a395	1.50	kg	2	\N	f
281666de-9a8e-40d3-9ef9-289a98cc5ac3	b38f6af7-3732-4908-9770-2ec9add01ef6	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.00	kg	3	\N	f
934b14cb-32a2-44d9-abb1-c40b3d5f35a8	b38f6af7-3732-4908-9770-2ec9add01ef6	6ba8b958-628e-424f-8040-49cfaa00985d	0.50	kg	4	\N	f
4ce02c58-f9e7-409a-b824-a5c35aa933f5	b38f6af7-3732-4908-9770-2ec9add01ef6	18222ed3-19a9-44d6-a028-e6fb2068136d	4.00	pieces	5	\N	f
fe907a5f-0af7-495a-95e7-43b36199062a	b38f6af7-3732-4908-9770-2ec9add01ef6	35c51dce-046e-41b8-abf8-df9b318116f7	3.00	pieces	6	\N	f
14c650f5-823e-4c8a-90bb-ebb207d323a8	b38f6af7-3732-4908-9770-2ec9add01ef6	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	7	\N	f
95eea901-c84a-433a-8452-2e9e8a5c09ab	b38f6af7-3732-4908-9770-2ec9add01ef6	176307fa-d193-4222-b90e-3e8b342e651e	50.00	pieces	8	\N	f
d483cb5e-9d93-4a1c-b478-bba2aebfb12e	b38f6af7-3732-4908-9770-2ec9add01ef6	4bfabd30-1486-4ec4-a019-6d61f4d72086	5.00	pieces	9	\N	f
e02f0108-b3f7-4eef-a6f9-e9be2b5a4735	b38f6af7-3732-4908-9770-2ec9add01ef6	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	10	\N	f
7bc39a6f-d5a4-4c4c-a7b3-3df0b8de41cc	b38f6af7-3732-4908-9770-2ec9add01ef6	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	11	\N	f
3cce3ec5-5229-476a-a05c-8e043a4d8a79	b38f6af7-3732-4908-9770-2ec9add01ef6	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	12	\N	f
58111d88-febf-4ee6-a3b4-88f4028a1bef	c545082c-f778-4ea5-8752-7dcb5f36f573	92820156-5037-4459-b7b6-8344ffabfd0d	2.00	kg	0	\N	f
c1766e27-7a4b-4134-9cc5-26c8c9d046e2	c545082c-f778-4ea5-8752-7dcb5f36f573	f4665f7d-81b6-414d-9cb9-b962febfe50b	20.00	pieces	1	\N	f
9cd39ef1-b8e0-4351-9e86-f6ddaa06ccb6	c545082c-f778-4ea5-8752-7dcb5f36f573	64f59ccf-be2a-4d15-ab83-94171e69a395	1.50	kg	2	\N	f
ea664e7d-d43f-444a-aef4-9384fe8a2a53	c545082c-f778-4ea5-8752-7dcb5f36f573	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.00	kg	3	\N	f
c22b4a24-1b91-47ff-bff5-f3f2b0aac45c	c545082c-f778-4ea5-8752-7dcb5f36f573	6ba8b958-628e-424f-8040-49cfaa00985d	0.50	kg	4	\N	f
9612165f-216e-4ec4-93ac-4462dab2a0a6	c545082c-f778-4ea5-8752-7dcb5f36f573	18222ed3-19a9-44d6-a028-e6fb2068136d	4.00	pieces	5	\N	f
5c67e8ec-20e0-4985-a58c-9ddc0e26b80b	c545082c-f778-4ea5-8752-7dcb5f36f573	35c51dce-046e-41b8-abf8-df9b318116f7	3.00	pieces	6	\N	f
d9ee6206-514f-443c-b9be-2701128757e2	c545082c-f778-4ea5-8752-7dcb5f36f573	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	3.00	pieces	7	\N	f
2cd65286-ab9e-4ab9-8ae9-ba06eb30168c	c545082c-f778-4ea5-8752-7dcb5f36f573	176307fa-d193-4222-b90e-3e8b342e651e	50.00	pieces	8	\N	f
71efe06d-873d-4307-8de8-bce8be51d5d4	c545082c-f778-4ea5-8752-7dcb5f36f573	4bfabd30-1486-4ec4-a019-6d61f4d72086	5.00	pieces	9	\N	f
2da48ce8-8966-4b38-901e-02e2ed73d38f	c545082c-f778-4ea5-8752-7dcb5f36f573	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	10	\N	f
21c53cda-6edf-4255-a6a5-30d300387520	c545082c-f778-4ea5-8752-7dcb5f36f573	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	11	\N	f
4da7684c-de63-489f-aee8-19a33eb78fe9	c545082c-f778-4ea5-8752-7dcb5f36f573	075c301f-67e2-4bff-bcc8-2d215fcdf849	2.00	pieces	12	\N	f
f4460866-e164-4825-9178-fd515819796e	c545082c-f778-4ea5-8752-7dcb5f36f573	1ee6ce11-fb15-44da-878a-267cbdd0b03a	2.00	pieces	13	\N	f
d2cbf2f9-46ee-40a5-b378-82eee539664e	c545082c-f778-4ea5-8752-7dcb5f36f573	973d147d-0217-41bf-bec2-ab39f80af20c	1.00	pieces	14	\N	f
d7e6477b-c335-4983-bdeb-77ddf175da19	c545082c-f778-4ea5-8752-7dcb5f36f573	25149783-1d1a-4449-b54a-1068ca3405ba	2.00	pieces	15	\N	f
18595a3e-5e7b-48b3-bab9-a6e5801190e2	c545082c-f778-4ea5-8752-7dcb5f36f573	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	16	\N	f
68fb5ffd-dc1c-4b96-8b63-3f31080a50f9	c545082c-f778-4ea5-8752-7dcb5f36f573	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	17	\N	f
26fa46ae-fc87-43ac-a7bd-a49af487cb6d	1f73bbdc-0063-414e-abd5-f7e2985838f8	176307fa-d193-4222-b90e-3e8b342e651e	35.00	pieces	0	\N	f
dcf9b816-b711-44b3-8bc6-72732ea1b6f7	1f73bbdc-0063-414e-abd5-f7e2985838f8	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.50	pieces	1	\N	f
86b1f6b4-fb4d-4704-a9f0-ae3e4d2978d3	1f73bbdc-0063-414e-abd5-f7e2985838f8	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.50	pieces	2	\N	f
9492248f-6034-4a82-9d35-25686cf658d1	40f810fe-c22c-483a-9ace-52218eb4bce4	041ef8f9-ffc1-441d-920b-168d7f2597fd	30.00	pieces	0	\N	f
4bdb376e-6d5e-4250-99ef-59bf76b59ef8	40f810fe-c22c-483a-9ace-52218eb4bce4	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	40.00	pieces	1	\N	f
cf669aec-72e8-4297-be09-d09708495cb2	40f810fe-c22c-483a-9ace-52218eb4bce4	74545d89-0336-41f8-b100-6b1a2c8cf381	6.00	pieces	2	\N	f
6f49c905-e96f-4cc6-b9e6-885d6c6e2e1e	40f810fe-c22c-483a-9ace-52218eb4bce4	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	9.00	pieces	3	\N	f
fbf4c590-c1bf-42d3-ab94-4cae0cce492e	40f810fe-c22c-483a-9ace-52218eb4bce4	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	4	\N	f
a49a742f-9f49-4dda-b22c-0a92e69601fc	40f810fe-c22c-483a-9ace-52218eb4bce4	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	15.00	pieces	5	\N	f
f4c0830f-4b99-4178-8214-aacd2a925c1a	40f810fe-c22c-483a-9ace-52218eb4bce4	92820156-5037-4459-b7b6-8344ffabfd0d	3.00	kg	6	\N	f
77486bc5-ba06-4b7c-8445-a91c50df9834	40f810fe-c22c-483a-9ace-52218eb4bce4	35c51dce-046e-41b8-abf8-df9b318116f7	4.00	pieces	7	\N	f
f11034f9-0735-4ce5-b7fc-54f5fef65931	40f810fe-c22c-483a-9ace-52218eb4bce4	e76dcae7-c72d-4957-9aa7-d627003e5bb2	20.00	pieces	8	\N	f
65c9d5f4-eb80-4c39-bcef-b16a7bf238fd	40f810fe-c22c-483a-9ace-52218eb4bce4	94610731-af1b-4ecf-bee2-4c37feee8f1d	25.00	pieces	9	\N	f
e1c8a411-6aee-4a18-9786-2c2d588ff929	40f810fe-c22c-483a-9ace-52218eb4bce4	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	8.00	pieces	10	\N	f
08d7e326-f592-4041-9dc9-88eb728229fc	40f810fe-c22c-483a-9ace-52218eb4bce4	f4665f7d-81b6-414d-9cb9-b962febfe50b	20.00	pieces	11	\N	f
7d3afaae-797e-4eb3-8257-535c4a4f994b	40f810fe-c22c-483a-9ace-52218eb4bce4	176307fa-d193-4222-b90e-3e8b342e651e	250.00	pieces	12	\N	f
bd0b96bf-3252-4358-a623-8ac828e04ae8	40f810fe-c22c-483a-9ace-52218eb4bce4	0da5a062-f5c8-4c88-98af-075e5ab0a509	50.00	pieces	13	\N	f
7b39dc93-9075-47a8-b092-907ba560f7ff	40f810fe-c22c-483a-9ace-52218eb4bce4	64f59ccf-be2a-4d15-ab83-94171e69a395	20.00	pieces	14	\N	f
5b23a112-8936-496b-8df7-c855322fa18a	40f810fe-c22c-483a-9ace-52218eb4bce4	6ba8b958-628e-424f-8040-49cfaa00985d	20.00	pieces	15	\N	f
4c1825fe-a96f-41a2-9648-08c20395a4a3	40f810fe-c22c-483a-9ace-52218eb4bce4	18222ed3-19a9-44d6-a028-e6fb2068136d	18.00	pieces	16	\N	f
d1e27820-faea-4751-bc37-ab7607a1f6cc	40f810fe-c22c-483a-9ace-52218eb4bce4	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	30.00	pieces	17	\N	f
801864b5-8ef1-42af-9069-7dae40aaa76d	40f810fe-c22c-483a-9ace-52218eb4bce4	feebdc41-9a89-4de4-8860-6c06c81c002a	5.00	pieces	18	\N	f
d47be76b-abf4-41a9-8a8a-ed39b160b77d	40f810fe-c22c-483a-9ace-52218eb4bce4	075c301f-67e2-4bff-bcc8-2d215fcdf849	45.00	pieces	19	\N	f
24a8728f-bb3b-45c5-984d-3362ce5f59ed	40f810fe-c22c-483a-9ace-52218eb4bce4	973d147d-0217-41bf-bec2-ab39f80af20c	12.00	pieces	20	\N	f
e56c6254-9848-43e2-bf07-7269285ddd6b	40f810fe-c22c-483a-9ace-52218eb4bce4	25149783-1d1a-4449-b54a-1068ca3405ba	3.00	pieces	21	\N	f
bbbc8704-c42f-4ce0-a96a-ec6f555b79c6	40f810fe-c22c-483a-9ace-52218eb4bce4	8b4a2f78-50b8-4374-a55b-a01b7aea7341	4.00	pieces	22	\N	f
4dacd3b6-8cfb-45f1-98bd-f97ae3227337	40f810fe-c22c-483a-9ace-52218eb4bce4	fbc92d53-9184-48c5-8fb6-08eb94762912	20.00	pieces	23	\N	f
67d749b7-c1cc-445e-8c2b-27fdfed82728	40f810fe-c22c-483a-9ace-52218eb4bce4	a62fef1f-06a6-483c-b784-f90780697743	2.00	pieces	24	\N	f
6f12955b-34f7-40fa-af90-52eb43a4e646	40f810fe-c22c-483a-9ace-52218eb4bce4	d6939926-e956-4295-96de-573dff94f2b2	3.00	pieces	25	\N	f
5ec1f3b6-37c5-47b4-b866-05a797bc1f20	40f810fe-c22c-483a-9ace-52218eb4bce4	8b601429-3aa0-409c-adce-9c42a6d25736	3.00	pieces	26	\N	f
a969810c-713a-4809-b14a-e9e22f3084fd	40f810fe-c22c-483a-9ace-52218eb4bce4	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.00	pieces	27	\N	f
1180838e-3989-4667-a584-c43bbf160791	40f810fe-c22c-483a-9ace-52218eb4bce4	c6dfabb9-0bb9-4e18-b26d-403b7a611852	1.00	pieces	28	\N	f
ae89b489-6e51-4f18-bd30-efb829164a78	40f810fe-c22c-483a-9ace-52218eb4bce4	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	5.00	pieces	29	\N	f
73299330-db29-41a6-b1e1-8f1cfd1e31f0	40f810fe-c22c-483a-9ace-52218eb4bce4	43620106-1595-430e-b31d-a30a17304cec	0.50	pieces	30	\N	f
d8f68c43-6215-4409-a3f7-3b353768f6b5	40f810fe-c22c-483a-9ace-52218eb4bce4	f9008beb-4663-4ceb-bd05-eefff8739259	2.00	pieces	31	\N	f
73e94cc4-2f75-4a05-9d7b-da862ad56733	40f810fe-c22c-483a-9ace-52218eb4bce4	8f9c3c34-d2ac-46f9-b3a7-97943a02fe06	8.00	pieces	32	\N	f
996306ea-f52f-4fac-bdef-2e74fb506805	40f810fe-c22c-483a-9ace-52218eb4bce4	1eea3318-ff50-409d-8759-9645f3aada40	6.00	pieces	33	\N	f
aabc2e65-917c-44d6-9d59-62883ea74024	40f810fe-c22c-483a-9ace-52218eb4bce4	4e3e47a9-131c-4351-ac41-1bafd8c657ce	28.00	pieces	34	\N	f
97d5695a-5e93-4aff-af66-7a8306b6c9f0	40f810fe-c22c-483a-9ace-52218eb4bce4	7c5ce30a-c741-40c6-81b6-bd846f705efd	6.00	pieces	35	\N	f
20bc39b4-2c43-4e8e-8f5b-f5c90440d579	40f810fe-c22c-483a-9ace-52218eb4bce4	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	4.00	pieces	36	\N	f
0fcfb8a3-8651-4321-9c4b-ddfbcd9d461c	40f810fe-c22c-483a-9ace-52218eb4bce4	34e7679d-b1d8-40b2-8359-be4a30e1a981	25.00	pieces	37	\N	f
45209909-956b-4d43-b8ba-95b1c1c2a232	37a58124-df53-46b7-ae56-4ad671f73724	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	3.00	pieces	0	\N	f
2fcf4123-ec4f-4179-a932-8b32f9366e92	abc3499a-40d9-42a3-b123-2de64c3b7765	fbc92d53-9184-48c5-8fb6-08eb94762912	1.00	pieces	17	\N	f
e62c3494-56c5-48cc-b56e-4fa5a6d44ce8	abc3499a-40d9-42a3-b123-2de64c3b7765	4e3e47a9-131c-4351-ac41-1bafd8c657ce	3.00	pieces	18	\N	f
f43cbba0-4d9c-4074-b442-fdef46f46a31	abc3499a-40d9-42a3-b123-2de64c3b7765	0a9a6c9d-7992-4c77-a64c-bdf768ffb5e5	2.00	pieces	19	\N	f
3754fdbd-9338-4bca-a796-e73710daa33b	077ab48d-a601-4def-b281-59bdafef0b5e	4e3e47a9-131c-4351-ac41-1bafd8c657ce	8.00	pieces	0	\N	f
a6ea19fd-2d74-4bb6-a0fb-7ff3405fea84	077ab48d-a601-4def-b281-59bdafef0b5e	7c5ce30a-c741-40c6-81b6-bd846f705efd	4.00	pieces	1	\N	f
7ac1d576-88ab-467f-946f-e76dc6ddb304	077ab48d-a601-4def-b281-59bdafef0b5e	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	2	\N	f
5b7dc959-832a-443d-bd73-e3f97fc57e00	077ab48d-a601-4def-b281-59bdafef0b5e	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	1.00	pieces	3	\N	f
e87c5440-9a3f-4f45-9f95-11249104669e	077ab48d-a601-4def-b281-59bdafef0b5e	f9008beb-4663-4ceb-bd05-eefff8739259	1.00	pieces	4	\N	f
378109d9-a619-44d0-b102-3d3b7a431edf	077d3135-9efc-4f8e-8d6f-a85d42aca72d	18222ed3-19a9-44d6-a028-e6fb2068136d	4.00	pieces	0	\N	f
8fdc67b0-4d8f-4b82-b4cd-88470f0b53ed	077d3135-9efc-4f8e-8d6f-a85d42aca72d	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	1	\N	f
fafa5646-71c1-44bf-8d38-df93d71ddbe9	077d3135-9efc-4f8e-8d6f-a85d42aca72d	176307fa-d193-4222-b90e-3e8b342e651e	15.00	pieces	2	\N	f
268fd899-e059-42d7-8ecc-f3d10edb617c	077d3135-9efc-4f8e-8d6f-a85d42aca72d	6ba8b958-628e-424f-8040-49cfaa00985d	4.00	pieces	3	\N	f
1b88054c-2d7f-49d1-b77f-f02995f236b5	077d3135-9efc-4f8e-8d6f-a85d42aca72d	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	4	\N	f
2fa69615-4ac7-414e-9268-53c984b022dc	077d3135-9efc-4f8e-8d6f-a85d42aca72d	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	5	\N	f
ffc69561-137a-4e61-bb56-3e53406a19ba	077d3135-9efc-4f8e-8d6f-a85d42aca72d	041ef8f9-ffc1-441d-920b-168d7f2597fd	15.00	pieces	6	\N	f
1908447a-00d6-437f-9962-1bdc1ed2c92d	c574a45d-da67-4a19-bb56-412949cb7cb2	46ecc1c7-459c-418d-a2ae-d336c9052445	150.00	pieces	0	\N	f
b9bba79a-6422-49ac-9b2b-422d2674822c	c574a45d-da67-4a19-bb56-412949cb7cb2	34a4209c-438e-456b-958c-d26717c67ecb	15.00	pieces	1	\N	f
301fd1f8-af92-4b68-b1bd-0c9b93d3195f	f269858a-09d0-4408-ba75-ff2a0fab515d	46ecc1c7-459c-418d-a2ae-d336c9052445	100.00	pieces	0	\N	f
a5541585-4eaf-4bc2-ad3a-432a46ab068c	f269858a-09d0-4408-ba75-ff2a0fab515d	34a4209c-438e-456b-958c-d26717c67ecb	8.00	pieces	1	\N	f
236138e3-8517-41e0-9eae-b51716a25f11	077d3135-9efc-4f8e-8d6f-a85d42aca72d	0da5a062-f5c8-4c88-98af-075e5ab0a509	20.00	pieces	7	\N	f
134a362f-7eb6-49b0-b310-740325dd032d	077d3135-9efc-4f8e-8d6f-a85d42aca72d	4bfabd30-1486-4ec4-a019-6d61f4d72086	1.00	pieces	8	\N	f
000d4b77-a40e-43b5-8720-8b2e52f6a3d5	077d3135-9efc-4f8e-8d6f-a85d42aca72d	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2.00	pieces	9	\N	f
7e151f87-96ea-4539-a570-79dc434ba6b0	077d3135-9efc-4f8e-8d6f-a85d42aca72d	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	10	\N	f
d956adb3-4208-453d-ba3d-6a225e645997	077d3135-9efc-4f8e-8d6f-a85d42aca72d	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	11	\N	f
9eaf554d-6ded-4b06-a75a-865fbd489eb1	077d3135-9efc-4f8e-8d6f-a85d42aca72d	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	12	\N	f
73fa9cab-6831-4427-a08e-6736c24b81c9	077d3135-9efc-4f8e-8d6f-a85d42aca72d	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	13	\N	f
7a16ca7c-83e2-4ac5-8f53-404405d67128	706137f2-92d1-431e-94ca-06c3df88145e	18222ed3-19a9-44d6-a028-e6fb2068136d	4.00	pieces	0	\N	f
1e2ae2b9-37cb-4143-9876-12ff124821cc	706137f2-92d1-431e-94ca-06c3df88145e	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	1	\N	f
b188d28b-7514-4d83-8a44-7c5d63a2dc37	706137f2-92d1-431e-94ca-06c3df88145e	176307fa-d193-4222-b90e-3e8b342e651e	15.00	pieces	2	\N	f
49ef519f-cd3a-4471-aca4-6e25d13c3eb4	706137f2-92d1-431e-94ca-06c3df88145e	6ba8b958-628e-424f-8040-49cfaa00985d	4.00	pieces	3	\N	f
a1a19f5f-c117-47d4-9f07-e98a06945531	706137f2-92d1-431e-94ca-06c3df88145e	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	4	\N	f
318b6d51-7305-4150-8fa3-7759d52f00b1	706137f2-92d1-431e-94ca-06c3df88145e	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	5	\N	f
6b8af736-e899-454a-aff3-ebd2fd8364e8	706137f2-92d1-431e-94ca-06c3df88145e	041ef8f9-ffc1-441d-920b-168d7f2597fd	15.00	pieces	6	\N	f
3ca2ad35-77cb-4cca-8f64-b91687456040	706137f2-92d1-431e-94ca-06c3df88145e	0da5a062-f5c8-4c88-98af-075e5ab0a509	20.00	pieces	7	\N	f
50ccb48c-9456-44eb-9d59-6bdbcfe34067	fb660835-57ca-4971-8eba-ae046404503c	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	10.00	pieces	0	\N	f
4a48ff78-6bcf-4dc2-b63e-275ff75aa0ea	fb660835-57ca-4971-8eba-ae046404503c	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	6.00	pieces	1	\N	f
6f2cda33-1108-48db-9135-3116976f632b	fb660835-57ca-4971-8eba-ae046404503c	d6939926-e956-4295-96de-573dff94f2b2	6.00	pieces	2	\N	f
bab46c39-3f42-4c0c-925e-1da8929d1a16	9dbba74e-3b84-49b6-a5fc-d6c3bd4f417c	6ba8b958-628e-424f-8040-49cfaa00985d	5.00	pieces	0	\N	f
e91b61d4-8da4-4fb3-a6af-2959e8020085	9dbba74e-3b84-49b6-a5fc-d6c3bd4f417c	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	2.00	pieces	1	\N	f
4fc99c7c-fb3f-48bd-8c80-0be6b87ee0cb	91d01be4-fb62-411d-9409-0eb9d91089bc	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	5.00	pieces	0	\N	f
3e33794c-fa45-42ce-b6dd-ad44bf6ff413	91d01be4-fb62-411d-9409-0eb9d91089bc	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	2.00	pieces	1	\N	f
fcbc0758-4259-432a-8c36-e2840f409f17	f68aeb87-2b89-4a2f-956a-7bf4d6d93052	46ecc1c7-459c-418d-a2ae-d336c9052445	15.00	pieces	0	\N	f
4faeb425-fae1-4f7f-9c45-bf885bac4b7b	9b79d1b7-dd49-480b-ab9d-219c164db12f	411ff911-5c57-497e-aef9-580351c88f24	20.00	pieces	0	\N	f
214cd355-b56f-400e-8080-8e1ff62b9196	9b79d1b7-dd49-480b-ab9d-219c164db12f	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	1	\N	f
9bb64bc1-903c-4b47-97a6-2b904cb01ff0	9b79d1b7-dd49-480b-ab9d-219c164db12f	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	3.00	pieces	2	\N	f
9068a4a5-f679-44e5-bdc6-e2d2c4035822	9b79d1b7-dd49-480b-ab9d-219c164db12f	74545d89-0336-41f8-b100-6b1a2c8cf381	8.00	pieces	3	\N	f
120ff548-ac78-41e1-acfd-523981e616b1	9b79d1b7-dd49-480b-ab9d-219c164db12f	c8f32f40-0f54-4fd5-b5f1-93e1d4191fd1	15.00	pieces	4	\N	f
571c516d-83c6-4f2d-853a-d38058be14d7	9b79d1b7-dd49-480b-ab9d-219c164db12f	f4665f7d-81b6-414d-9cb9-b962febfe50b	0.50	kg	5	\N	f
6023f040-6d8d-4886-aa68-997edafc3240	9b79d1b7-dd49-480b-ab9d-219c164db12f	94610731-af1b-4ecf-bee2-4c37feee8f1d	0.50	kg	6	\N	f
05fda692-9962-4ab8-9477-61a79483181f	9b79d1b7-dd49-480b-ab9d-219c164db12f	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.50	kg	7	\N	f
2ed78348-10c2-4012-8a89-094af3f1fb62	9b79d1b7-dd49-480b-ab9d-219c164db12f	92820156-5037-4459-b7b6-8344ffabfd0d	2.00	kg	8	\N	f
4ebca555-2558-4816-9c5a-3dfc66411fbd	9b79d1b7-dd49-480b-ab9d-219c164db12f	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	9	\N	f
2167f4d7-b29d-428e-be34-8943106629ca	9b79d1b7-dd49-480b-ab9d-219c164db12f	0da5a062-f5c8-4c88-98af-075e5ab0a509	3.50	kg	10	\N	f
6d5d5fdb-19c4-4d94-b1ca-8046d2c8320a	9b79d1b7-dd49-480b-ab9d-219c164db12f	176307fa-d193-4222-b90e-3e8b342e651e	3.00	kg	11	\N	f
ec30804c-c0b1-46d0-830e-94507f685dbf	9b79d1b7-dd49-480b-ab9d-219c164db12f	64f59ccf-be2a-4d15-ab83-94171e69a395	2.00	kg	12	\N	f
3ff0d6b4-fec5-40b4-bfb9-153aa3a536fc	9b79d1b7-dd49-480b-ab9d-219c164db12f	0d125ce5-2534-4eb5-b6f4-d8427ac5ef1a	15.00	pieces	13	\N	f
4e53e8ef-8fc2-44d7-a2b2-3134ca4c0d9c	9b79d1b7-dd49-480b-ab9d-219c164db12f	35c51dce-046e-41b8-abf8-df9b318116f7	4.00	pieces	14	\N	f
b28c8c4b-c503-4414-bd01-863c6783ed02	9b79d1b7-dd49-480b-ab9d-219c164db12f	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	10.00	pieces	15	\N	f
227e3412-56f1-4fe2-9877-9d00e129ff1a	806fcd17-e0f6-4abd-b658-125b25b266d9	18222ed3-19a9-44d6-a028-e6fb2068136d	5.00	pieces	0	\N	f
181e1be6-313a-47bc-81bb-67aaec9aa795	806fcd17-e0f6-4abd-b658-125b25b266d9	8480b77a-07cd-4b5d-8769-2af7e717b684	1.00	pieces	1	\N	f
c3c61de6-6618-47c4-819e-1b0360fbaf59	806fcd17-e0f6-4abd-b658-125b25b266d9	176307fa-d193-4222-b90e-3e8b342e651e	10.00	pieces	2	\N	f
e9e607e2-79ae-4354-9c81-7e0507ab2b91	806fcd17-e0f6-4abd-b658-125b25b266d9	6ba8b958-628e-424f-8040-49cfaa00985d	4.00	pieces	3	\N	f
9509a29e-a7fe-4a98-a97f-75ffc54fb91c	806fcd17-e0f6-4abd-b658-125b25b266d9	92820156-5037-4459-b7b6-8344ffabfd0d	10.00	pieces	4	\N	f
c7c2f478-a965-4270-8c5f-6f5f735b4b96	806fcd17-e0f6-4abd-b658-125b25b266d9	f4665f7d-81b6-414d-9cb9-b962febfe50b	10.00	pieces	5	\N	f
6a7f02c9-0cb5-4c83-bd17-5568d6dce5ec	806fcd17-e0f6-4abd-b658-125b25b266d9	041ef8f9-ffc1-441d-920b-168d7f2597fd	15.00	pieces	6	\N	f
4219f154-5f57-4a16-b561-7cda5c7ac895	806fcd17-e0f6-4abd-b658-125b25b266d9	0da5a062-f5c8-4c88-98af-075e5ab0a509	20.00	pieces	7	\N	f
db5cb375-be10-43b4-a90e-61a1771d336d	806fcd17-e0f6-4abd-b658-125b25b266d9	8480b77a-07cd-4b5d-8769-2af7e717b684	5.00	pieces	8	\N	f
a030b47d-a05d-4e77-8f3c-9990c9eb44bc	806fcd17-e0f6-4abd-b658-125b25b266d9	4bfabd30-1486-4ec4-a019-6d61f4d72086	1.00	pieces	9	\N	f
c47a1bed-507a-469a-a4d3-a2555658c381	806fcd17-e0f6-4abd-b658-125b25b266d9	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	4.00	pieces	10	\N	f
51cd8eb6-29a6-4c98-8ebd-2e5b2aae61bf	806fcd17-e0f6-4abd-b658-125b25b266d9	74545d89-0336-41f8-b100-6b1a2c8cf381	2.00	pieces	11	\N	f
05d451f1-89db-4225-9295-ae7361fea21b	806fcd17-e0f6-4abd-b658-125b25b266d9	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	12	\N	f
1780a55e-33da-45b5-8c9e-03cae5b8bb00	806fcd17-e0f6-4abd-b658-125b25b266d9	973d147d-0217-41bf-bec2-ab39f80af20c	4.00	pieces	13	\N	f
ccc797ed-9674-4f51-b992-8d3bd066e1f3	806fcd17-e0f6-4abd-b658-125b25b266d9	8b4a2f78-50b8-4374-a55b-a01b7aea7341	1.00	pieces	14	\N	f
d6a3e132-1839-4a08-b698-ae9540f9e798	806fcd17-e0f6-4abd-b658-125b25b266d9	075c301f-67e2-4bff-bcc8-2d215fcdf849	1.00	pieces	15	\N	f
73bd2599-261f-4c12-b352-b57cb32822cd	806fcd17-e0f6-4abd-b658-125b25b266d9	e4d79a03-d550-440a-84e0-cb87a56de8a3	1.00	pieces	16	\N	f
284f1295-932c-4fb9-bb88-4149bb748e24	806fcd17-e0f6-4abd-b658-125b25b266d9	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	0.50	pieces	17	\N	f
b0f2f0f2-b3cf-4883-affa-a844256a8d10	806fcd17-e0f6-4abd-b658-125b25b266d9	725caca3-1174-4f0e-8374-d00465cc932d	2.00	pieces	18	\N	f
602844ff-716e-4437-81e5-6e76350ebe66	153c2d49-6998-4ddc-be98-5a38307124af	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	12.00	pieces	0	\N	f
d84d14e9-a2d2-4393-bfcd-970cf495ffa7	153c2d49-6998-4ddc-be98-5a38307124af	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	8.00	pieces	1	\N	f
b72f812d-c23b-4479-87d2-ff1a1c0ca8eb	153c2d49-6998-4ddc-be98-5a38307124af	8b4a2f78-50b8-4374-a55b-a01b7aea7341	4.00	pieces	2	\N	f
0d0e1918-0193-44da-bfe3-6fa52c1895c8	153c2d49-6998-4ddc-be98-5a38307124af	fbc92d53-9184-48c5-8fb6-08eb94762912	6.00	pieces	3	\N	f
f1bacbf9-8d55-490c-9b54-d2c18a8f5825	153c2d49-6998-4ddc-be98-5a38307124af	74545d89-0336-41f8-b100-6b1a2c8cf381	7.00	pieces	4	\N	f
50a13b20-396a-4382-907b-981c8f2f1780	153c2d49-6998-4ddc-be98-5a38307124af	075c301f-67e2-4bff-bcc8-2d215fcdf849	6.00	pieces	5	\N	f
112a586e-681b-4758-b758-a348e9030ffd	153c2d49-6998-4ddc-be98-5a38307124af	041ef8f9-ffc1-441d-920b-168d7f2597fd	1.00	kg	6	\N	f
51796d8e-d477-4081-b01c-81689ab072b8	153c2d49-6998-4ddc-be98-5a38307124af	0da5a062-f5c8-4c88-98af-075e5ab0a509	1.00	kg	7	\N	f
7d487f78-8436-4326-9e3d-c215a9277d0d	153c2d49-6998-4ddc-be98-5a38307124af	176307fa-d193-4222-b90e-3e8b342e651e	1.00	kg	8	\N	f
44ed0ea7-371e-4da6-8a9e-bbdd82acbd10	153c2d49-6998-4ddc-be98-5a38307124af	8b601429-3aa0-409c-adce-9c42a6d25736	3.00	pieces	9	\N	f
bbb39e3d-9841-45fd-88c9-4363f3e3e5eb	153c2d49-6998-4ddc-be98-5a38307124af	a62fef1f-06a6-483c-b784-f90780697743	3.00	pieces	10	\N	f
2ae08777-b685-4f66-9dc6-faa2439e1a0f	153c2d49-6998-4ddc-be98-5a38307124af	d6939926-e956-4295-96de-573dff94f2b2	3.00	pieces	11	\N	f
eeb4505a-b994-4cdb-8802-046f0f72447b	8463d5e9-01f2-4330-bbbe-0171a03fa9ee	0da5a062-f5c8-4c88-98af-075e5ab0a509	8.00	pieces	0	\N	f
4f7efc1b-13f5-432c-99dd-9f831e8928ae	8463d5e9-01f2-4330-bbbe-0171a03fa9ee	176307fa-d193-4222-b90e-3e8b342e651e	12.00	pieces	1	\N	f
5cc2a8a4-f519-4ff7-8e43-7dded19ad405	8463d5e9-01f2-4330-bbbe-0171a03fa9ee	6ba8b958-628e-424f-8040-49cfaa00985d	5.00	pieces	2	\N	f
1a8aac1b-aced-441c-8a24-bdea1c240881	6b0d6e40-8faf-41fb-ac48-1bbdba759c7b	0da5a062-f5c8-4c88-98af-075e5ab0a509	8.00	pieces	0	\N	f
435f2e67-da8b-478e-b2e1-7cc7748e7a38	6b0d6e40-8faf-41fb-ac48-1bbdba759c7b	176307fa-d193-4222-b90e-3e8b342e651e	12.00	pieces	1	\N	f
ba98d657-49f5-4651-a880-d3af45dd3a71	6b0d6e40-8faf-41fb-ac48-1bbdba759c7b	6ba8b958-628e-424f-8040-49cfaa00985d	5.00	pieces	2	\N	f
820a3689-0b9c-45d7-bb7c-28a308a62242	6b0d6e40-8faf-41fb-ac48-1bbdba759c7b	973d147d-0217-41bf-bec2-ab39f80af20c	2.00	pieces	3	\N	f
1a20ec9e-3771-48f6-b231-766ba03b9c8d	6b0d6e40-8faf-41fb-ac48-1bbdba759c7b	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	4	\N	f
f17e36f0-21a5-4bbf-baab-71e3a16e75f6	6b0d6e40-8faf-41fb-ac48-1bbdba759c7b	075c301f-67e2-4bff-bcc8-2d215fcdf849	5.00	pieces	5	\N	f
bdee9595-7482-4d87-88e2-ede33ec938a0	706137f2-92d1-431e-94ca-06c3df88145e	4bfabd30-1486-4ec4-a019-6d61f4d72086	1.00	pieces	8	\N	f
e9e200a2-44fd-4560-90df-ada91bf2bdff	706137f2-92d1-431e-94ca-06c3df88145e	eb90b2d2-2c83-4c36-bbdf-f570d1064e1a	2.00	pieces	9	\N	f
0c7751a4-b528-4e46-ac5c-517b9df121cd	706137f2-92d1-431e-94ca-06c3df88145e	74545d89-0336-41f8-b100-6b1a2c8cf381	3.00	pieces	10	\N	f
626ed454-93ad-4758-9468-ac55e040f9eb	706137f2-92d1-431e-94ca-06c3df88145e	89ea0009-a5d9-45a0-88e9-f0ba20d6fb5f	1.00	pieces	11	\N	f
587d4bbf-de35-4272-923b-b1dfa8166738	706137f2-92d1-431e-94ca-06c3df88145e	973d147d-0217-41bf-bec2-ab39f80af20c	2.00	pieces	12	\N	f
3f060778-91e6-4b3b-a2b5-eea9fbd07bae	706137f2-92d1-431e-94ca-06c3df88145e	075c301f-67e2-4bff-bcc8-2d215fcdf849	2.00	pieces	13	\N	f
db33b7de-28ef-4fc2-843a-abf40d2d060f	706137f2-92d1-431e-94ca-06c3df88145e	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.00	pieces	14	\N	f
303025ca-ca6c-4fb1-ae2b-f5360f03a227	706137f2-92d1-431e-94ca-06c3df88145e	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	15	\N	f
cdf83875-b9a4-4329-be0b-3dec7a411233	d6174c83-4afd-4a36-aef8-a02c695e42e6	0da5a062-f5c8-4c88-98af-075e5ab0a509	31.00	pieces	0	\N	f
50fd8647-105a-488b-9bee-347ef61d8015	d6174c83-4afd-4a36-aef8-a02c695e42e6	6ba8b958-628e-424f-8040-49cfaa00985d	10.00	pieces	1	\N	f
3521c4b8-85e9-4141-b6d2-d634a59c80e7	d6174c83-4afd-4a36-aef8-a02c695e42e6	92820156-5037-4459-b7b6-8344ffabfd0d	25.00	pieces	2	\N	f
dc710621-4a80-48dd-a7b3-82eba4fd116c	d6174c83-4afd-4a36-aef8-a02c695e42e6	176307fa-d193-4222-b90e-3e8b342e651e	9.00	pieces	3	\N	f
770eab2b-e5ac-4ef6-a628-10b90a97aa7e	d6174c83-4afd-4a36-aef8-a02c695e42e6	18222ed3-19a9-44d6-a028-e6fb2068136d	1.00	pieces	4	\N	f
b15c4abc-2791-4cad-870c-0ee048f81810	d6174c83-4afd-4a36-aef8-a02c695e42e6	ffd2739c-2b0a-411f-9f0b-fbae8e4552a7	1.00	pieces	5	\N	f
d0d6365c-e516-43db-b7cd-3c36fb02b8b7	d6174c83-4afd-4a36-aef8-a02c695e42e6	041ef8f9-ffc1-441d-920b-168d7f2597fd	4.00	pieces	6	\N	f
2f9f57ab-3db9-4641-9fea-834d280dd2f8	d6174c83-4afd-4a36-aef8-a02c695e42e6	e76dcae7-c72d-4957-9aa7-d627003e5bb2	8.00	pieces	7	\N	f
579c98a6-4b5f-4e6f-987a-b5e4229db88b	cfda3ecc-7766-4e07-921c-54a327ae7835	0da5a062-f5c8-4c88-98af-075e5ab0a509	31.00	pieces	0	\N	f
39a07b35-78ea-467e-bd79-5bc3d97ede64	cfda3ecc-7766-4e07-921c-54a327ae7835	6ba8b958-628e-424f-8040-49cfaa00985d	10.00	pieces	1	\N	f
2c61fe9d-c4ad-4727-8ef2-1bbd14056a06	9b79d1b7-dd49-480b-ab9d-219c164db12f	6ba8b958-628e-424f-8040-49cfaa00985d	2.00	kg	16	\N	f
200c83a7-e425-4abf-a522-3917059f18d7	9b79d1b7-dd49-480b-ab9d-219c164db12f	e76dcae7-c72d-4957-9aa7-d627003e5bb2	1.00	kg	17	\N	f
0fc30499-5579-49c8-af0a-f4064fe5c668	9b79d1b7-dd49-480b-ab9d-219c164db12f	19d26861-9882-4ce9-8dfc-27b9d8a1d66c	11.00	pieces	18	\N	f
0e3596e4-b3c3-40e1-ab63-6cf7ac955940	9b79d1b7-dd49-480b-ab9d-219c164db12f	8480b77a-07cd-4b5d-8769-2af7e717b684	2.00	pieces	19	\N	f
c99a7632-2a52-4aeb-91d3-6468673c77d0	9b79d1b7-dd49-480b-ab9d-219c164db12f	4e3e47a9-131c-4351-ac41-1bafd8c657ce	10.00	pieces	20	\N	f
ee28a8ec-6110-4edd-a2da-d3ff2ac04429	9b79d1b7-dd49-480b-ab9d-219c164db12f	7c5ce30a-c741-40c6-81b6-bd846f705efd	5.00	pieces	21	\N	f
f25cfe65-88c7-4c16-9201-2bfb8cbce86c	9b79d1b7-dd49-480b-ab9d-219c164db12f	a2a3a4f5-1852-4fcd-a9e3-f7c9d7de8be0	1.50	pieces	22	\N	f
dae96b8f-96c0-4c50-afc4-a92c0e54613c	9b79d1b7-dd49-480b-ab9d-219c164db12f	e9cdb77a-c874-4f1e-9fa2-df0a3fabbd6a	0.50	pieces	23	\N	f
dfa64980-6089-4dfa-8261-7a7307a82f65	9b79d1b7-dd49-480b-ab9d-219c164db12f	f9008beb-4663-4ceb-bd05-eefff8739259	2.00	pieces	24	\N	f
204c9382-bcdf-4f5c-ac5e-040ac84c8296	cfda3ecc-7766-4e07-921c-54a327ae7835	92820156-5037-4459-b7b6-8344ffabfd0d	25.00	pieces	2	\N	f
d0d02531-262b-405e-8370-06fd9afd5420	cfda3ecc-7766-4e07-921c-54a327ae7835	176307fa-d193-4222-b90e-3e8b342e651e	9.00	pieces	3	\N	f
f600b6a6-29ee-4ee0-beef-47ed7af0fa69	cfda3ecc-7766-4e07-921c-54a327ae7835	18222ed3-19a9-44d6-a028-e6fb2068136d	2.00	pieces	4	\N	f
0f803e8e-9de2-487e-a04a-d693332ee329	cfda3ecc-7766-4e07-921c-54a327ae7835	041ef8f9-ffc1-441d-920b-168d7f2597fd	4.00	pieces	5	\N	f
a0c95f80-70fe-4ad3-8716-1fbe9aa0607e	cfda3ecc-7766-4e07-921c-54a327ae7835	e76dcae7-c72d-4957-9aa7-d627003e5bb2	8.00	pieces	6	\N	f
b558d107-a117-464d-b758-6f953fd9657b	1da796dc-2e5f-4b26-8bc9-07dde697c53a	0da5a062-f5c8-4c88-98af-075e5ab0a509	18.00	pieces	0	\N	f
83dd650e-7476-43d4-b66a-542d9324ac2b	1da796dc-2e5f-4b26-8bc9-07dde697c53a	e76dcae7-c72d-4957-9aa7-d627003e5bb2	0.60	kg	1	\N	f
41b3c144-2673-4a89-bdf6-d77fc9478d75	1da796dc-2e5f-4b26-8bc9-07dde697c53a	6ba8b958-628e-424f-8040-49cfaa00985d	10.00	pieces	2	\N	f
f60faa13-4969-45d8-9b3d-4f83db09a48c	1da796dc-2e5f-4b26-8bc9-07dde697c53a	92820156-5037-4459-b7b6-8344ffabfd0d	26.00	pieces	3	\N	f
e9080eaa-3187-4cbc-9178-830357018881	1da796dc-2e5f-4b26-8bc9-07dde697c53a	620723fb-8ddc-43c6-b1b8-24a471d05dd3	1.00	pieces	4	\N	f
9c879ee5-0e16-49fd-bf3a-a27ca89b0f23	1da796dc-2e5f-4b26-8bc9-07dde697c53a	18222ed3-19a9-44d6-a028-e6fb2068136d	1.00	pieces	5	\N	f
5deb7e04-6a86-49e0-81d3-6cb0266d3b27	1da796dc-2e5f-4b26-8bc9-07dde697c53a	176307fa-d193-4222-b90e-3e8b342e651e	12.00	pieces	6	\N	f
46270b63-0a6f-4d12-a077-831d96f63043	7f3ebce8-e8f0-41a9-9bcc-14c11ef20415	1ee13245-65c0-4b20-86cc-39df95635f48	7.00	kg	0	\N	f
\.


--
-- Data for Name: recurring_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recurring_orders (id, bakery_id, customer_id, weekdays) FROM stdin;
14d7ba59-2d30-4dc2-a406-1e090a06b91c	c59cf1ca-1701-476e-8045-584ecac569e4	633dddf7-5b9f-41ec-bbba-6bf17153efd1	{1,2,3,4,5}
4fc73065-4d50-4f43-ba46-d2498537e6fc	c59cf1ca-1701-476e-8045-584ecac569e4	5da77be1-5979-4b52-8458-0714e4c125ae	{1,2,3,4,5}
434d7b6c-10c5-4354-a13a-fdf04adc634a	c59cf1ca-1701-476e-8045-584ecac569e4	4521485d-fabe-4642-ae7b-b0977a907778	{6}
36d1b575-8f05-421b-976b-490309d7362b	c59cf1ca-1701-476e-8045-584ecac569e4	394263e1-862e-4ba8-9f0f-c8111bfdad04	{2,3,4,5}
58e24b2a-0582-4788-a641-ce215027ac6b	c59cf1ca-1701-476e-8045-584ecac569e4	a6acee58-86b7-4e3c-be37-1a027f81d472	{6}
5789d0e6-8edd-414d-b227-6076e0b49adb	c59cf1ca-1701-476e-8045-584ecac569e4	fcdeefb8-4a01-48a1-8182-4e69846adb36	{1,2,3,4,5}
b9d38fa5-4254-411f-bdb1-d91d2f8a5291	c59cf1ca-1701-476e-8045-584ecac569e4	2f5b6619-208f-4b16-80d6-4aba66a2c354	{2,3,4,5}
c410243e-e5b1-4c41-b4d5-d091f1a54dd6	c59cf1ca-1701-476e-8045-584ecac569e4	d77beea8-aee1-496d-bf77-197fe5a7d33d	{1,2,3,4,5,6}
a433b723-cbb4-4523-8b53-df1ee16e3f42	c59cf1ca-1701-476e-8045-584ecac569e4	62048060-cd8f-4d05-a079-935b498a603d	{6}
abc3499a-40d9-42a3-b123-2de64c3b7765	c59cf1ca-1701-476e-8045-584ecac569e4	22ae3c6e-cb84-4f54-9d4f-6bd08a536e7e	{2,3,4,5}
00b57a27-e7a8-4e91-85d7-678245b9c0d2	c59cf1ca-1701-476e-8045-584ecac569e4	079bc3e5-9ced-4d8e-b161-aa9873237eec	{1,3,2,4,5}
5b225055-a7b4-4141-b208-722fd8d2397c	c59cf1ca-1701-476e-8045-584ecac569e4	b02cc935-ac79-4eba-ad33-bd16bc281a76	{6}
ed432b8b-2be7-4b8b-964c-4d2d56be2e9e	c59cf1ca-1701-476e-8045-584ecac569e4	5392609a-b64e-4ace-9165-decba56dd007	{2,3,4,5,6}
d368ae04-4e30-4591-ba84-afa005712b4e	c59cf1ca-1701-476e-8045-584ecac569e4	8813879e-e196-4ac4-b789-6604191de723	{1,3,2,4,5}
fc3f2ff8-490b-4f9e-808f-6f77495c1731	c59cf1ca-1701-476e-8045-584ecac569e4	0ca9feb0-22dd-4639-a9e6-250698fad811	{3,4,5}
3b4e8297-9c54-4b7d-982d-ef92ebd403e3	c59cf1ca-1701-476e-8045-584ecac569e4	9793e3a6-71ed-4214-a2a4-d6c63949460f	{1}
d39de284-5ec1-43d7-8004-f288e9cabe94	c59cf1ca-1701-476e-8045-584ecac569e4	5895aff1-7b2c-4cd6-91fd-03784949555d	{6}
3ab5eede-d096-4d2f-8b7a-9262a9a31a77	c59cf1ca-1701-476e-8045-584ecac569e4	f0ae8f60-6c0b-456d-b4bc-3c2d6e8243c9	{1,2,3,5,6,4}
45303d29-9305-442f-aaad-0b3469cb14c4	c59cf1ca-1701-476e-8045-584ecac569e4	d3d03a88-b990-4f2a-89b3-44129b6e1a8d	{2,1,3,4,5,6}
26164861-f5e0-4721-82e9-beaee984dbbe	c59cf1ca-1701-476e-8045-584ecac569e4	ca613f17-e271-4112-b8a7-4ad570cb883e	{1,2,4,3,5}
344a93dc-7dcb-4b6c-8d21-57021cd0ca8c	c59cf1ca-1701-476e-8045-584ecac569e4	940fe04c-9492-4338-92ae-f5a8523564f6	{6}
669f6abc-f8d0-44b2-90c7-4945d7229885	c59cf1ca-1701-476e-8045-584ecac569e4	3b023775-f555-424b-afbb-621523bfc6c4	{1}
6068d6c1-9abd-4685-b719-c17e233f8965	c59cf1ca-1701-476e-8045-584ecac569e4	a673fbc3-6270-4dc1-bb16-eec8e75aa3bc	{1,2,3,4,5,6}
6748e092-d2d1-49c4-b5c0-87e6a2284d2b	c59cf1ca-1701-476e-8045-584ecac569e4	11d5a819-8cb2-4e7f-8ca4-ab74e03f4d48	{1,3,2,4,5,6}
867d041f-c376-404c-9626-48e14b612edf	c59cf1ca-1701-476e-8045-584ecac569e4	ae232ce5-658d-4f5e-9f20-5ae4c7fa3e32	{2,3,4,5,6,1}
2afbc9e8-92ad-4d08-bf05-1738abf27739	c59cf1ca-1701-476e-8045-584ecac569e4	288393fb-b6de-47e2-af27-9a01b5f0e48b	{2,3,4,5}
301b36da-7899-47d1-97b3-ff15e4dae8fd	c59cf1ca-1701-476e-8045-584ecac569e4	6b4b4262-1803-4c1e-8ee2-18a6b232db44	{2,3,4,5}
8e77e722-4646-4157-8c96-f631e5c5951c	c59cf1ca-1701-476e-8045-584ecac569e4	04063944-3993-49f1-9a3c-78c7b28317f0	{2,3,4,5}
034328f3-db77-4eb7-8c12-4a84b8b7e868	c59cf1ca-1701-476e-8045-584ecac569e4	e8108da7-47ac-4a37-aa97-a735e0caf5ae	{2,3,4,5}
a2322f12-b0ce-45ef-af63-2dd84a24d1c2	c59cf1ca-1701-476e-8045-584ecac569e4	894cbadb-9274-4cb7-811c-6ea7beb9e547	{1}
c4c7bd63-8306-4c56-bc8d-e8d7988351b1	c59cf1ca-1701-476e-8045-584ecac569e4	4936666b-0307-4246-8fa0-81f928b7e488	{2,3,4,1,5,6}
fa572801-0db3-4345-a5cb-edf273d2a50f	c59cf1ca-1701-476e-8045-584ecac569e4	6f486bb1-d469-488d-a000-936fd09668e0	{1}
9b79d1b7-dd49-480b-ab9d-219c164db12f	c59cf1ca-1701-476e-8045-584ecac569e4	4d6bc915-5d6b-448c-9ed2-b6ac83108f81	{1}
cf360098-ae45-4da7-b6af-81531f68218f	c59cf1ca-1701-476e-8045-584ecac569e4	6b8f8d83-4a4d-41ad-92e4-a16a09e090ca	{2,3,4,5}
68557438-0912-4f64-bab4-2e807a2d0182	c59cf1ca-1701-476e-8045-584ecac569e4	4971bc8e-a7f2-426d-a02a-5bde6ecd5aff	{3,4,5,2,6}
d44e7f25-c5fb-4a39-95b8-733973dc3e9a	c59cf1ca-1701-476e-8045-584ecac569e4	07cc24cc-d0c0-442c-aeec-11afc6f0374d	{1}
27a2e2c2-6c2c-483e-95c6-e0a1e37c6425	c59cf1ca-1701-476e-8045-584ecac569e4	daca63ba-fd3b-433f-b304-a72989bc4192	{2,3,4,5}
daa9665a-5802-492a-81d2-ed90a75638e4	c59cf1ca-1701-476e-8045-584ecac569e4	3edade55-dc29-41ca-96b4-e8112b690417	{1}
e7223ca2-7bfa-45b8-a564-610ccdf8037a	c59cf1ca-1701-476e-8045-584ecac569e4	0d15e08b-5e7f-4f56-bfe3-9c6fc4b759b8	{1}
0ff9cddf-ac64-4d61-9a4c-590089a1f526	c59cf1ca-1701-476e-8045-584ecac569e4	4c330f97-0072-4a8b-b838-dd5a80e04743	{2,3,4,5}
d6d0ccc2-7f55-4af7-94b4-2e3d1fa9cd4d	c59cf1ca-1701-476e-8045-584ecac569e4	401640c2-5c26-41a4-a497-8f8ef3260fc4	{2,3,4,5}
ef3aa308-7ced-4bbe-9974-e131e842639a	c59cf1ca-1701-476e-8045-584ecac569e4	c404a6df-578e-444b-a29a-c3e0d3e8d6b5	{2,1,3,4,5}
3e06ed16-c79e-4dd3-a0f1-26cd49f38e5b	c59cf1ca-1701-476e-8045-584ecac569e4	6fbcd3bb-4cad-42b6-a48f-5b54a20f2162	{6}
2f513ebe-397d-4915-aa7f-02a56ebd8db4	c59cf1ca-1701-476e-8045-584ecac569e4	c0097363-6934-44ce-bcb9-3326398f03d5	{6}
a9bd0635-13b5-4ae3-aa31-c2c80dedb277	c59cf1ca-1701-476e-8045-584ecac569e4	4c7fc769-9886-4922-a1c4-4088e6129a1f	{2,3,4,5}
25c7b705-b072-42a9-9a57-7e9cd9bc692c	c59cf1ca-1701-476e-8045-584ecac569e4	2588c605-43fd-4bd9-960f-b5e531cd500c	{6}
dde20e7d-ad24-4010-bf7c-21be8673d0e4	c59cf1ca-1701-476e-8045-584ecac569e4	cdf1089c-ffcd-4e68-b7e2-076e7fdf56ba	{6}
fa2934e9-2c9d-4992-a851-ec866ff667c8	c59cf1ca-1701-476e-8045-584ecac569e4	99b425f3-fc3e-42bf-8d95-b0b1b4aeac96	{6}
f1f7e226-b4e0-4e72-9e99-12326ff4b12c	c59cf1ca-1701-476e-8045-584ecac569e4	21d59b57-1639-4b62-8639-5313e246bf7f	{1,2,3,4,5}
cabd7953-c6b2-4085-84df-7312520977bb	c59cf1ca-1701-476e-8045-584ecac569e4	8da24ed2-caf4-4b0f-bb96-964c4885ec6e	{6}
8e842d94-c4eb-4d3f-a033-183c1a5513ba	c59cf1ca-1701-476e-8045-584ecac569e4	74be11ea-ca84-4488-89ca-f6e0d2fab8ce	{6}
0a2081d5-57e8-4835-b96b-431787ecb1f2	c59cf1ca-1701-476e-8045-584ecac569e4	8a3bce96-f4e0-4d17-918b-8bd0232a4ef8	{1,2,3,4,5}
544f098f-2d10-4bb1-9140-0977c35df94c	c59cf1ca-1701-476e-8045-584ecac569e4	eaaebe76-c3f5-440a-8962-a9928dd229a3	{6}
23e9521a-57a2-4cd5-8a2f-ca97f35da394	c59cf1ca-1701-476e-8045-584ecac569e4	577785d6-7777-4a19-b3c0-3eab2dae76d2	{6}
5a402df6-a3f6-44dd-88ca-2c47d789525c	c59cf1ca-1701-476e-8045-584ecac569e4	9bc2f9da-5cba-45f5-9c3f-540736c11e12	{1,2,3,4,5}
13775ff6-6eca-4a1c-a9a5-f5e35709e12f	c59cf1ca-1701-476e-8045-584ecac569e4	5741d63c-03e6-4bcf-8997-04fa15d2ce54	{6}
9dbba74e-3b84-49b6-a5fc-d6c3bd4f417c	c59cf1ca-1701-476e-8045-584ecac569e4	00cfe484-775a-42c9-8ead-3f502f0da9c0	{6}
3178f5c4-01be-42ab-843b-4e922a6dbcb9	c59cf1ca-1701-476e-8045-584ecac569e4	dda07f05-6821-4216-ac71-f3baad9927e4	{6}
b38f6af7-3732-4908-9770-2ec9add01ef6	c59cf1ca-1701-476e-8045-584ecac569e4	e0e7778a-f8f6-407e-8f4a-424e6ade02d1	{1}
40f810fe-c22c-483a-9ace-52218eb4bce4	c59cf1ca-1701-476e-8045-584ecac569e4	81c8e48f-be6f-42d2-994c-d9a02d08c852	{6}
65b93158-a34e-46ca-89b9-c219e4110984	c59cf1ca-1701-476e-8045-584ecac569e4	0dab90bf-6bc0-41e0-96cc-74d26e6d603d	{1}
f269858a-09d0-4408-ba75-ff2a0fab515d	c59cf1ca-1701-476e-8045-584ecac569e4	a3595dbc-3d22-45d5-8bc3-440a2a7e4f25	{2}
d6174c83-4afd-4a36-aef8-a02c695e42e6	c59cf1ca-1701-476e-8045-584ecac569e4	0b2fc911-df7e-4bd0-b309-8cb13a702bd1	{2,3,4,5}
8463d5e9-01f2-4330-bbbe-0171a03fa9ee	c59cf1ca-1701-476e-8045-584ecac569e4	19bfe055-0567-4aac-80d8-c2487cbe7ef2	{1,2,4,5,3}
ba7cd36d-f648-4020-be65-a6f832bb70a3	c59cf1ca-1701-476e-8045-584ecac569e4	a0d7c395-0588-4c05-9b97-e701f8025c19	{6}
93125c8f-fc83-4497-909e-029227179a57	c59cf1ca-1701-476e-8045-584ecac569e4	8cc9ab0a-cc49-449b-a61b-528919a9e715	{2,3,4,5}
706137f2-92d1-431e-94ca-06c3df88145e	c59cf1ca-1701-476e-8045-584ecac569e4	d49987bc-173a-417f-b9ef-da73548ed937	{2,3,4,5}
ea650b98-0375-494d-8f7c-18730577573a	c59cf1ca-1701-476e-8045-584ecac569e4	f48b54f1-3b16-495d-a934-abaca0dd5b47	{1}
5144d781-efad-4eb6-ab07-a00aaaa92bee	c59cf1ca-1701-476e-8045-584ecac569e4	2ee3ec45-4b67-4d05-a5ce-1a023edbb101	{1}
077d3135-9efc-4f8e-8d6f-a85d42aca72d	c59cf1ca-1701-476e-8045-584ecac569e4	fb04fe78-9d1e-4a9b-80ba-508735c81f51	{1}
9e39141a-4f8a-4ec1-b797-8652e73629dd	c59cf1ca-1701-476e-8045-584ecac569e4	d4f24e04-8a5d-49a1-b598-52fdbe0a60ba	{6}
77a754fc-a73d-4924-9fb2-cf3fe3d258f2	c59cf1ca-1701-476e-8045-584ecac569e4	6c7a870b-b025-4bc2-8b6d-c02b0f87fc00	{6}
4f50bafa-b5dc-4e4d-a151-93cb945133b7	c59cf1ca-1701-476e-8045-584ecac569e4	2532fb82-150a-425a-880c-b9f56067c60d	{2,3,4,5}
ec83870f-f756-443e-9477-2c2bfaa4341a	c59cf1ca-1701-476e-8045-584ecac569e4	62b75f77-6757-4880-b901-b51de3f65461	{2,3,4,5}
a5e8d2e4-4e34-4a1e-9907-83d104477c7a	c59cf1ca-1701-476e-8045-584ecac569e4	0aedcd37-9e79-4814-af35-f84cd086ae35	{6}
84f8057e-d548-4918-b4fc-47a4cf154b00	c59cf1ca-1701-476e-8045-584ecac569e4	f5a9c339-fa39-41b5-8bc9-66370b718611	{1,2,3,4,5}
58179021-c117-4ee6-9838-7d4891892d40	c59cf1ca-1701-476e-8045-584ecac569e4	86c53372-e266-45b1-8b00-b012abb7acb2	{6}
9794474d-64fa-480c-b24a-8cd4cb8ea648	c59cf1ca-1701-476e-8045-584ecac569e4	0f7879c9-bdef-4c8c-84e7-6395f1c2a480	{6}
c545082c-f778-4ea5-8752-7dcb5f36f573	c59cf1ca-1701-476e-8045-584ecac569e4	f5f646ac-139f-4236-b39d-ff7fb0ebd49c	{6}
1f73bbdc-0063-414e-abd5-f7e2985838f8	c59cf1ca-1701-476e-8045-584ecac569e4	f18e8603-a1bf-480f-a04a-72e923f6f840	{6}
1bd6788a-85c5-4549-8763-570b811266ca	c59cf1ca-1701-476e-8045-584ecac569e4	3e08f094-ea18-4805-aeb8-3385acb35d5d	{2,3,4,5,1}
8217a681-d6ef-470d-90b6-3a193ec19dd0	c59cf1ca-1701-476e-8045-584ecac569e4	a44a2534-7461-4ae6-aefd-f35b71b0786b	{6}
077ab48d-a601-4def-b281-59bdafef0b5e	c59cf1ca-1701-476e-8045-584ecac569e4	bc3bf050-3d02-4f1e-9cfb-2e05cd36ac92	{6}
c574a45d-da67-4a19-bb56-412949cb7cb2	c59cf1ca-1701-476e-8045-584ecac569e4	da66e9ec-6209-4924-beee-ad3d2c3caedb	{6}
fb660835-57ca-4971-8eba-ae046404503c	c59cf1ca-1701-476e-8045-584ecac569e4	b3ce2c2f-8a8f-4358-ab15-24c153e81642	{6}
91d01be4-fb62-411d-9409-0eb9d91089bc	c59cf1ca-1701-476e-8045-584ecac569e4	92cf4e50-4cf6-4be8-9c46-33fc4790a037	{6}
f68aeb87-2b89-4a2f-956a-7bf4d6d93052	c59cf1ca-1701-476e-8045-584ecac569e4	b5f04919-6ead-4cc1-b4c1-fc9eb86a2d5f	{6}
806fcd17-e0f6-4abd-b658-125b25b266d9	c59cf1ca-1701-476e-8045-584ecac569e4	ab8f3b56-800f-4ff5-82e9-f3aa8de4b16b	{6}
153c2d49-6998-4ddc-be98-5a38307124af	c59cf1ca-1701-476e-8045-584ecac569e4	62313297-8537-4d25-b885-82d3b48fed81	{6}
6b0d6e40-8faf-41fb-ac48-1bbdba759c7b	c59cf1ca-1701-476e-8045-584ecac569e4	ef32c73b-fa81-4232-aa36-e90492bac3fe	{6}
4d6552b6-7c4c-456f-b068-26755bad135f	c59cf1ca-1701-476e-8045-584ecac569e4	5925749c-d692-4db6-b2df-776288712341	{6}
2b551728-e33b-4387-81e1-ed231f1d74df	c59cf1ca-1701-476e-8045-584ecac569e4	4995f937-9646-4a2e-8a7f-a3f68d270a4c	{6}
744138a0-6914-482c-ba2f-87daea0715dd	c59cf1ca-1701-476e-8045-584ecac569e4	fd619afc-d15f-41d9-a038-ea5687c32e44	{2,6}
27e8ba74-6926-40c8-8a9f-ebca597c27d1	c59cf1ca-1701-476e-8045-584ecac569e4	1dea546c-e534-45d6-8668-1bc86717393d	{6}
90f1b9cf-eff6-4363-abb7-b7693e90f5e4	c59cf1ca-1701-476e-8045-584ecac569e4	a03ad5a4-adbd-4a6f-a6f4-9f5f7e095a44	{6}
a1758b01-04fd-4751-9d0b-2ae1682bcd0e	c59cf1ca-1701-476e-8045-584ecac569e4	de447924-c905-4bc6-8183-0400e6801f38	{6}
b4d436c0-dc7a-46fb-947e-fc2f835e81be	c59cf1ca-1701-476e-8045-584ecac569e4	34aa3d9f-024c-4adc-a90b-f13a5539b8b2	{2,6}
34b57f7b-910f-4ac4-b647-9d4e565e02fa	c59cf1ca-1701-476e-8045-584ecac569e4	143c8cd8-7184-4a77-90ab-1072f0fafa68	{6}
b0089c8d-78ab-4e71-ba0e-bd262ba304a1	c59cf1ca-1701-476e-8045-584ecac569e4	c841f876-6398-48d7-80ff-e15a49dd6468	{6}
5c591444-60c0-4a9d-9c71-d1646ed83fec	c59cf1ca-1701-476e-8045-584ecac569e4	b99c6dcb-bd98-48f7-a694-a825ce74cce7	{6}
ca5256e3-6b31-4997-8fb8-0aadc8b590e8	c59cf1ca-1701-476e-8045-584ecac569e4	ce008209-a756-42cc-9e1f-2474d021bc24	{1}
86a76dab-bf20-4217-81c5-b438c24ae953	c59cf1ca-1701-476e-8045-584ecac569e4	c3a1d2b8-df74-476e-a583-7b417af23d47	{1}
37a58124-df53-46b7-ae56-4ad671f73724	c59cf1ca-1701-476e-8045-584ecac569e4	2210a675-49eb-4b1a-9bfa-dede036e1c5d	{1}
cfda3ecc-7766-4e07-921c-54a327ae7835	c59cf1ca-1701-476e-8045-584ecac569e4	30ad80a0-fccd-482c-9757-cf0405e165d0	{1}
1da796dc-2e5f-4b26-8bc9-07dde697c53a	c59cf1ca-1701-476e-8045-584ecac569e4	785b3a85-0fb8-491c-b803-bdc4916d2655	{6}
d89f724c-5d92-4f0d-b95d-0f95bb06321a	c59cf1ca-1701-476e-8045-584ecac569e4	529a7318-222b-4095-9202-a51d5d1bc492	{2,5}
cf0c10b2-dd16-4575-967c-8be0c01aaa19	c59cf1ca-1701-476e-8045-584ecac569e4	9e848de4-ef6a-4c46-9cda-b51fa0317538	{2,3,4,5,6,1}
7f3ebce8-e8f0-41a9-9bcc-14c11ef20415	c59cf1ca-1701-476e-8045-584ecac569e4	f9ef02da-74eb-498b-be89-c9c430f45ec6	{2,1,3,4,5,6}
468f8ec2-bd65-48fd-b5ff-7d51e741930c	c59cf1ca-1701-476e-8045-584ecac569e4	d689d207-8fa1-483c-8d44-d6b2ba942a47	{1}
5e47101b-7d24-400b-9bed-f84378afd330	c59cf1ca-1701-476e-8045-584ecac569e4	4ac48014-73dc-403b-99e7-10e2bb8b3c51	{1}
2c3aaeae-5700-4485-b765-69e6ca76f5b5	c59cf1ca-1701-476e-8045-584ecac569e4	4a6ff664-55d9-4f9f-997c-38159e1263d6	{6}
\.


--
-- Data for Name: role_permission_overrides; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permission_overrides (bakery_id, role, permission, allowed) FROM stdin;
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sections (id, bakery_id, name, color, "order") FROM stdin;
7323cd80-0277-4018-b8b1-b7fa492e3d53	c59cf1ca-1701-476e-8045-584ecac569e4	Pane alla frutta	bg-rose-100 text-rose-800	0
b086e936-57e5-46fa-a38e-51108e627e3b	c59cf1ca-1701-476e-8045-584ecac569e4	Pane bianco	bg-orange-100 text-orange-800	1
0de1bd01-a5eb-43b0-b907-7508f48922f7	c59cf1ca-1701-476e-8045-584ecac569e4	Pane integrale	bg-amber-100 text-amber-800	2
7c503445-e49c-4edc-bac2-cfba4e888e41	c59cf1ca-1701-476e-8045-584ecac569e4	Semola	bg-cyan-100 text-cyan-800	3
7161eb07-8905-4420-9110-254473ef1a59	c59cf1ca-1701-476e-8045-584ecac569e4	Lievito madre	bg-red-100 text-red-800	4
9857c383-4882-4cef-b54d-bb826aad3c0b	c59cf1ca-1701-476e-8045-584ecac569e4	Cornetti	bg-amber-100 text-amber-800	5
9b52e186-55ff-4764-93c6-baf6d318706b	c59cf1ca-1701-476e-8045-584ecac569e4	Pizze	bg-blue-100 text-blue-800	7
1ebcb358-4dc0-47fd-8a69-b0aca4ed63d1	c59cf1ca-1701-476e-8045-584ecac569e4	Pale	bg-violet-100 text-violet-800	8
a6ff3047-f0c0-4460-b154-fcc75bce65f7	c59cf1ca-1701-476e-8045-584ecac569e4	Focacce	bg-teal-100 text-teal-800	9
715936a2-2b15-4dcd-bb89-e9eb9cb12142	c59cf1ca-1701-476e-8045-584ecac569e4	Biscotti	bg-pink-100 text-pink-800	10
39876ee6-f565-4d53-9bc8-ae623218ae55	c59cf1ca-1701-476e-8045-584ecac569e4	Grissini	bg-amber-100 text-amber-800	11
fa0fe3cc-f061-454b-9ccb-2414ff773744	c59cf1ca-1701-476e-8045-584ecac569e4	Taralli	bg-amber-100 text-amber-800	12
f5f842cb-bdef-4b10-9148-5aa597fbb4b5	c59cf1ca-1701-476e-8045-584ecac569e4	Torte	bg-emerald-100 text-emerald-800	13
2e39ca0b-f486-4e8a-a6f4-1becd07bfa79	c59cf1ca-1701-476e-8045-584ecac569e4	Varie	bg-amber-100 text-amber-800	14
\.


--
-- Data for Name: user_permission_overrides; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_permission_overrides (user_id, permission, allowed) FROM stdin;
715b7b75-47d1-408d-8c49-05a638b7a741	statistics:view	t
715b7b75-47d1-408d-8c49-05a638b7a741	customers:write	f
715b7b75-47d1-408d-8c49-05a638b7a741	orders:edit	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, bakery_id, email, password_hash, role, name, created_at, must_change_password) FROM stdin;
28b688cf-c450-4bf9-93a1-001eb749057b	c59cf1ca-1701-476e-8045-584ecac569e4	luca.dentella@gmail.com	$2b$12$gDo3ya9WyDS5i/bem9K0/eVU2nlw7rODDE5c68XXBWn1IDn/mwKOK	admin	Luca	2026-05-17 12:41:25.663565+00	f
0b76a94f-44a0-448f-8772-79c943c5eb3a	c59cf1ca-1701-476e-8045-584ecac569e4	luca@gmail.com	$2b$12$SfTmR0gD0XvJm7Ndr9T8neheDZpNcOjk0vwR5.grKBF.eeNhts0zC	staff	\N	2026-05-26 12:27:35.693251+00	f
b3b3553a-b1a5-4938-8dfd-a052e9cfbc3c	c59cf1ca-1701-476e-8045-584ecac569e4	sergio@gmail.com	$2b$12$yEZieZpTA8MLNGZKthWcO.fXXbND48ydK5TMTwscpVjbUFOf31H..	staff	\N	2026-05-26 12:28:08.978541+00	f
8b8a1e45-d278-495c-8f5a-4beb6d7dd1b2	c59cf1ca-1701-476e-8045-584ecac569e4	mattia@gmail.com	$2b$12$7y.TmYRe4uow.fjKg0lIg.h5dKNJPzem7Z90s0Y5MJjNduOzA40VS	staff	\N	2026-05-26 12:28:31.767894+00	f
3b83ce93-1dd7-4a29-9ba2-685bf3ec328d	c59cf1ca-1701-476e-8045-584ecac569e4	papa@gmail.com	$2b$12$8revNQeo0DSTcOu7FMy53OmMrg.c2S4yP0dGbukak8qrrSu4XO/FG	owner	\N	2026-05-26 12:27:05.855088+00	f
715b7b75-47d1-408d-8c49-05a638b7a741	c59cf1ca-1701-476e-8045-584ecac569e4	simone@gmail.com	$2b$12$FKjDysAuPC5oAi16KUp.sOd0gbPLs8jIIuLsYTM0Ip4ebY8ZnL1j6	owner	\N	2026-05-27 16:22:38.478504+00	f
f4227655-8bfe-4ea4-b0c3-b2bcc4546ed1	c59cf1ca-1701-476e-8045-584ecac569e4	alex@gmail.com	$2b$12$WgHzF7dB5bFrXaVxN3tdBeXRok4fX7zytNiivs05DsGCoCKcj7Dw2	staff	\N	2026-06-30 01:24:05.337918+00	f
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: neondb_owner
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 4, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: bakeries bakeries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bakeries
    ADD CONSTRAINT bakeries_pkey PRIMARY KEY (id);


--
-- Name: bakeries bakeries_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bakeries
    ADD CONSTRAINT bakeries_slug_unique UNIQUE (slug);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: daily_item_status daily_item_status_bakery_id_date_customer_id_product_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_item_status
    ADD CONSTRAINT daily_item_status_bakery_id_date_customer_id_product_id_pk PRIMARY KEY (bakery_id, date, customer_id, product_id);


--
-- Name: daily_order_items daily_order_items_order_product_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_order_items
    ADD CONSTRAINT daily_order_items_order_product_key UNIQUE (daily_order_id, product_id);


--
-- Name: daily_order_items daily_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_order_items
    ADD CONSTRAINT daily_order_items_pkey PRIMARY KEY (id);


--
-- Name: daily_orders daily_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_orders
    ADD CONSTRAINT daily_orders_pkey PRIMARY KEY (id);


--
-- Name: daily_orders daily_orders_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_orders
    ADD CONSTRAINT daily_orders_unique UNIQUE (bakery_id, date, customer_id);


--
-- Name: divisors divisors_bakery_id_product_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.divisors
    ADD CONSTRAINT divisors_bakery_id_product_id_pk PRIMARY KEY (bakery_id, product_id);


--
-- Name: production_group_sections production_group_sections_group_id_section_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_group_sections
    ADD CONSTRAINT production_group_sections_group_id_section_id_pk PRIMARY KEY (group_id, section_id);


--
-- Name: production_groups production_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_groups
    ADD CONSTRAINT production_groups_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: recurring_order_items recurring_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recurring_order_items
    ADD CONSTRAINT recurring_order_items_pkey PRIMARY KEY (id);


--
-- Name: recurring_orders recurring_orders_customer_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recurring_orders
    ADD CONSTRAINT recurring_orders_customer_id_unique UNIQUE (customer_id);


--
-- Name: recurring_orders recurring_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recurring_orders
    ADD CONSTRAINT recurring_orders_pkey PRIMARY KEY (id);


--
-- Name: role_permission_overrides role_permission_overrides_bakery_id_role_permission_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permission_overrides
    ADD CONSTRAINT role_permission_overrides_bakery_id_role_permission_pk PRIMARY KEY (bakery_id, role, permission);


--
-- Name: sections sections_bakery_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_bakery_name_key UNIQUE (bakery_id, name);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: user_permission_overrides user_permission_overrides_user_id_permission_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_permission_overrides
    ADD CONSTRAINT user_permission_overrides_user_id_permission_pk PRIMARY KEY (user_id, permission);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: customers_bakery_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX customers_bakery_idx ON public.customers USING btree (bakery_id);


--
-- Name: daily_item_status_date_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX daily_item_status_date_idx ON public.daily_item_status USING btree (bakery_id, date);


--
-- Name: daily_items_order_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX daily_items_order_idx ON public.daily_order_items USING btree (daily_order_id);


--
-- Name: daily_orders_date_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX daily_orders_date_idx ON public.daily_orders USING btree (bakery_id, date);


--
-- Name: production_groups_bakery_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX production_groups_bakery_idx ON public.production_groups USING btree (bakery_id);


--
-- Name: products_bakery_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX products_bakery_idx ON public.products USING btree (bakery_id);


--
-- Name: products_section_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX products_section_idx ON public.products USING btree (section_id);


--
-- Name: recurring_items_order_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX recurring_items_order_idx ON public.recurring_order_items USING btree (recurring_order_id);


--
-- Name: recurring_orders_bakery_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX recurring_orders_bakery_idx ON public.recurring_orders USING btree (bakery_id);


--
-- Name: sections_bakery_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX sections_bakery_idx ON public.sections USING btree (bakery_id);


--
-- Name: users_bakery_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX users_bakery_idx ON public.users USING btree (bakery_id);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: customers customers_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: daily_item_status daily_item_status_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_item_status
    ADD CONSTRAINT daily_item_status_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: daily_item_status daily_item_status_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_item_status
    ADD CONSTRAINT daily_item_status_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: daily_item_status daily_item_status_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_item_status
    ADD CONSTRAINT daily_item_status_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: daily_order_items daily_order_items_daily_order_id_daily_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_order_items
    ADD CONSTRAINT daily_order_items_daily_order_id_daily_orders_id_fk FOREIGN KEY (daily_order_id) REFERENCES public.daily_orders(id) ON DELETE CASCADE;


--
-- Name: daily_order_items daily_order_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_order_items
    ADD CONSTRAINT daily_order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: daily_orders daily_orders_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_orders
    ADD CONSTRAINT daily_orders_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: daily_orders daily_orders_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_orders
    ADD CONSTRAINT daily_orders_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: divisors divisors_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.divisors
    ADD CONSTRAINT divisors_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: divisors divisors_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.divisors
    ADD CONSTRAINT divisors_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: production_group_sections production_group_sections_group_id_production_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_group_sections
    ADD CONSTRAINT production_group_sections_group_id_production_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.production_groups(id) ON DELETE CASCADE;


--
-- Name: production_group_sections production_group_sections_section_id_sections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_group_sections
    ADD CONSTRAINT production_group_sections_section_id_sections_id_fk FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- Name: production_groups production_groups_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_groups
    ADD CONSTRAINT production_groups_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: products products_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: products products_section_id_sections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_section_id_sections_id_fk FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE RESTRICT;


--
-- Name: recurring_order_items recurring_order_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recurring_order_items
    ADD CONSTRAINT recurring_order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: recurring_order_items recurring_order_items_recurring_order_id_recurring_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recurring_order_items
    ADD CONSTRAINT recurring_order_items_recurring_order_id_recurring_orders_id_fk FOREIGN KEY (recurring_order_id) REFERENCES public.recurring_orders(id) ON DELETE CASCADE;


--
-- Name: recurring_orders recurring_orders_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recurring_orders
    ADD CONSTRAINT recurring_orders_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: recurring_orders recurring_orders_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recurring_orders
    ADD CONSTRAINT recurring_orders_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: role_permission_overrides role_permission_overrides_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permission_overrides
    ADD CONSTRAINT role_permission_overrides_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: sections sections_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: user_permission_overrides user_permission_overrides_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_permission_overrides
    ADD CONSTRAINT user_permission_overrides_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_bakery_id_bakeries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_bakery_id_bakeries_id_fk FOREIGN KEY (bakery_id) REFERENCES public.bakeries(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict WTD1NSwtAMxe2ySjZFlxMdlTuYlRdNjqWy3eCM8WM52dzG79sEnmyXJkoPsXpP5

