/*
  MOM Writer tables for SQL Server 2016+ / Azure SQL.

  Run once against the app's database (DB_DATABASE in .env), in SQL Server
  Management Studio or with:
      sqlcmd -S <server> -d <database> -U <user> -P <password> -C -i database/schema.mssql.sql

  Safe to run again: each table is created only if it does not exist yet.
  Nothing here drops, empties or changes an existing table.

  The app does not use Laravel migrations. Do not run "php artisan migrate:fresh",
  "migrate:refresh", "migrate:reset", "migrate:rollback" or "db:wipe" against a
  real database: they drop tables. This app blocks those commands.
*/

/* New database? Create it first (Thai collation), then switch to it:
CREATE DATABASE mom_writer COLLATE Thai_100_CI_AS;
GO
USE mom_writer;
GO
*/

/* One row per meeting. The whole document (sections, attendees, signatures...)
   is JSON in [data]; the other columns are copies used for listing and
   searching, refreshed by the API on every save. */
IF OBJECT_ID(N'dbo.moms', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.moms (
        id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_moms PRIMARY KEY,
        title         NVARCHAR(255) NOT NULL,
        meeting_date  DATE          NULL,
        location      NVARCHAR(255) NULL,
        recorder      NVARCHAR(255) NULL,
        open_actions  INT           NOT NULL CONSTRAINT DF_moms_open_actions DEFAULT (0),
        search_text   NVARCHAR(MAX) NULL,
        data          NVARCHAR(MAX) NOT NULL CONSTRAINT CK_moms_data_json CHECK (ISJSON(data) = 1),
        version       INT           NOT NULL CONSTRAINT DF_moms_version DEFAULT (1),
        created_by    NVARCHAR(50)  NULL,   -- employee_code
        updated_by    NVARCHAR(50)  NULL,   -- employee_code
        created_at    DATETIME2(0)  NULL,
        updated_at    DATETIME2(0)  NULL,
        deleted_at    DATETIME2(0)  NULL    -- set when deleted; the app can restore it
    );
    CREATE INDEX moms_deleted_at_meeting_date_index ON dbo.moms (deleted_at, meeting_date);
END
GO

/* Address book used to fill in attendees quickly. */
IF OBJECT_ID(N'dbo.mom_contacts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.mom_contacts (
        id          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_mom_contacts PRIMARY KEY,
        name        NVARCHAR(255) NOT NULL,
        email       NVARCHAR(255) NULL,
        role        NVARCHAR(255) NULL,
        created_at  DATETIME2(0)  NULL,
        updated_at  DATETIME2(0)  NULL
    );
    CREATE INDEX mom_contacts_name_index ON dbo.mom_contacts (name);
    -- Unique email, but several contacts may have no email.
    CREATE UNIQUE INDEX mom_contacts_email_unique ON dbo.mom_contacts (email) WHERE email IS NOT NULL;
END
GO

/* Optional: a login for the app with read/write access only (no DDL rights,
   so the app itself can never drop a table). Run as an administrator and
   change the password; then put it in DB_USERNAME / DB_PASSWORD.

USE master;
CREATE LOGIN mom_app WITH PASSWORD = N'change-me-Str0ng!';
GO
USE mom_writer;
CREATE USER mom_app FOR LOGIN mom_app;
ALTER ROLE db_datareader ADD MEMBER mom_app;
ALTER ROLE db_datawriter ADD MEMBER mom_app;
GO
*/
