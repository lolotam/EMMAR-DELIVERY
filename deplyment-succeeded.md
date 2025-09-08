root@srv889400:~# cd /opt && ls -la
total 48
drwxr-xr-x 12 root root 4096 Sep  7 20:40 .
drwxr-xr-x 22 root root 4096 Sep  8 00:04 ..
drwxr-xr-x 19 root root 4096 Sep  7 22:35 CREERFLOW
drwxr-xr-x  9 root root 4096 Jul 10 08:31 abusoliman
drwxr-xr-x 17 root root 4096 Aug  1 03:18 alorfmedz
drwxr-xr-x  5 root root 4096 Aug  1 02:13 backups
drwx--x--x  4 root root 4096 Jul  4 20:46 containerd
drwxr-xr-x  2 root root 4096 Jul 27 10:39 filebrowser
drwxr-xr-x 20 root root 4096 Aug 11 17:10 hospital
drwxr-xr-x  2 root root 4096 Jul  6 11:56 n8n
drwxr-xr-x 14 root root 4096 Jul 22 16:20 sarafly
drwxr-xr-x  2 root root 4096 Aug  1 02:05 scripts
root@srv889400:/opt# git clone https://github.com/lolotam/EMMAR-DELIVERY.git
Cloning into 'EMMAR-DELIVERY'...
remote: Enumerating objects: 264, done.
remote: Counting objects: 100% (264/264), done.
remote: Compressing objects: 100% (161/161), done.
remote: Total 264 (delta 74), reused 264 (delta 74), pack-reused 0 (from 0)
Receiving objects: 100% (264/264), 4.93 MiB | 36.06 MiB/s, done.
Resolving deltas: 100% (74/74), done.
root@srv889400:/opt# cd EMMAR-DELIVERY && ls -la
total 748
drwxr-xr-x 20 root root   4096 Sep  8 00:10 .
drwxr-xr-x 13 root root   4096 Sep  8 00:10 ..
drwxr-xr-x  3 root root   4096 Sep  8 00:10 .augment
drwxr-xr-x  2 root root   4096 Sep  8 00:10 .claude
drwxr-xr-x  2 root root   4096 Sep  8 00:10 .clinerules
-rw-r--r--  1 root root   1085 Sep  8 00:10 .env
drwxr-xr-x  8 root root   4096 Sep  8 00:10 .git
drwxr-xr-x  2 root root   4096 Sep  8 00:10 .github
-rw-r--r--  1 root root    265 Sep  8 00:10 .gitignore
-rw-r--r--  1 root root  13121 Sep  8 00:10 .gitignore.backup
drwxr-xr-x  3 root root   4096 Sep  8 00:10 .kilocode
drwxr-xr-x  3 root root   4096 Sep  8 00:10 .roo
drwxr-xr-x  2 root root   4096 Sep  8 00:10 .vscode
-rw-r--r--  1 root root   6135 Sep  8 00:10 ADMIN_PASSWORD_CHANGE_TEST_PLAN.md
-rw-r--r--  1 root root  10775 Sep  8 00:10 CLAUDE.md
-rw-r--r--  1 root root  12409 Sep  8 00:10 COMPREHENSIVE_VERIFICATION_REPORT.md
-rw-r--r--  1 root root   6528 Sep  8 00:10 CRITICAL_ISSUES_FIXED_SUMMARY.md
-rw-r--r--  1 root root  10152 Sep  8 00:10 DEPLOYMENT.md
-rw-r--r--  1 root root   8715 Sep  8 00:10 DEPLOYMENT_SUMMARY.md
-rw-r--r--  1 root root   8023 Sep  8 00:10 DOCUMENT_CARD_CLICK_FIX.md
-rw-r--r--  1 root root  12618 Sep  8 00:10 DOCUMENT_OPERATIONS_FIX.md
-rw-r--r--  1 root root   9164 Sep  8 00:10 FINAL_COMPREHENSIVE_REPORT.md
-rw-r--r--  1 root root   1088 Sep  8 00:10 LICENSE
-rw-r--r--  1 root root   6541 Sep  8 00:10 PASSWORD_VISIBILITY_FIXES_SUMMARY.md
-rw-r--r--  1 root root  10122 Sep  8 00:10 README.md
-rw-r--r--  1 root root   7624 Sep  8 00:10 SECURITY_FIXES_DOCUMENTATION.md
drwxr-xr-x  2 root root   4096 Sep  8 00:10 __pycache__
-rw-r--r--  1 root root 229189 Sep  8 00:10 app.py
-rw-r--r--  1 root root   4419 Sep  8 00:10 authentication_analysis.md
drwxr-xr-x  3 root root   4096 Sep  8 00:10 backups
-rw-r--r--  1 root root   5924 Sep  8 00:10 browser_test_instructions.md
-rw-r--r--  1 root root   7911 Sep  8 00:10 code_duplication_analysis.md
-rw-r--r--  1 root root   7272 Sep  8 00:10 comprehensive_analysis_summary.md
-rw-r--r--  1 root root    498 Sep  8 00:10 comprehensive_verification_results.json
-rw-r--r--  1 root root  12438 Sep  8 00:10 context_library_research.md
-rw-r--r--  1 root root    131 Sep  8 00:10 cookies.txt
-rw-r--r--  1 root root   5857 Sep  8 00:10 csp_analysis.md
drwxr-xr-x  3 root root   4096 Sep  8 00:10 data
-rw-r--r--  1 root root   1722 Sep  8 00:10 debug_upload.py
drwxr-xr-x  2 root root   4096 Sep  8 00:10 docs
-rw-r--r--  1 root root    510 Sep  8 00:10 driver.csv
-rw-r--r--  1 root root  15920 Sep  8 00:10 emar-implementation-guide.md
drwxr-xr-x  2 root root   4096 Sep  8 00:10 exports
-rw-r--r--  1 root root   2921 Sep  8 00:10 fix_unicode_issues.py
-rw-r--r--  1 root root   9924 Sep  8 00:10 javascript_errors_analysis.md
-rw-r--r--  1 root root    456 Sep  8 00:10 requirements.txt
drwxr-xr-x  2 root root   4096 Sep  8 00:10 secure_uploads
-rw-r--r--  1 root root   2372 Sep  8 00:10 setup_uploads.py
drwxr-xr-x  6 root root   4096 Sep  8 00:10 static
drwxr-xr-x  2 root root   4096 Sep  8 00:10 templates
-rw-r--r--  1 root root   8117 Sep  8 00:10 test_all_document_operations.py
-rw-r--r--  1 root root    677 Sep  8 00:10 test_auth.py
-rw-r--r--  1 root root  10282 Sep  8 00:10 test_both_fixes.html
-rw-r--r--  1 root root  16520 Sep  8 00:10 test_comprehensive_verification.py
-rw-r--r--  1 root root   5721 Sep  8 00:10 test_debug_operations.py
-rw-r--r--  1 root root   7350 Sep  8 00:10 test_document_core.py
-rw-r--r--  1 root root  10526 Sep  8 00:10 test_document_endpoints.py
-rw-r--r--  1 root root   8813 Sep  8 00:10 test_document_endpoints_clean.py
-rw-r--r--  1 root root   7684 Sep  8 00:10 test_document_functions.py
-rw-r--r--  1 root root   8189 Sep  8 00:10 test_document_upload_direct.py
-rw-r--r--  1 root root   4791 Sep  8 00:10 test_documents_integration.py
-rw-r--r--  1 root root   9396 Sep  8 00:10 test_final.html
-rw-r--r--  1 root root   8128 Sep  8 00:10 test_final_comprehensive.py
-rw-r--r--  1 root root   3821 Sep  8 00:10 test_password_change.py
-rw-r--r--  1 root root  10986 Sep  8 00:10 test_password_visibility_fixes.html
-rw-r--r--  1 root root    955 Sep  8 00:10 test_routes.py
-rw-r--r--  1 root root   7565 Sep  8 00:10 test_settings_page_fix.html
-rw-r--r--  1 root root   4266 Sep  8 00:10 test_upload_with_csrf.py
-rw-r--r--  1 root root   4328 Sep  8 00:10 testing_results.md
drwxr-xr-x  3 root root   4096 Sep  8 00:10 uploads
drwxr-xr-x  3 root root   4096 Sep  8 00:10 utils
root@srv889400:/opt/EMMAR-DELIVERY# ls -la | grep -i docker
root@srv889400:/opt/EMMAR-DELIVERY# cat requirements.txt
# Core Flask Framework
Flask==3.0.0
Werkzeug==3.0.1

# Flask Extensions
Flask-CORS==4.0.0
Flask-Limiter==3.5.0
Flask-WTF==1.2.1
Flask-Talisman==1.1.0

# Security & Authentication
bcrypt==4.1.2
python-dotenv==1.0.0

# Date & Time Utilities
python-dateutil==2.8.2

# File Processing
openpyxl==3.1.2
python-magic==0.4.27

# Development Dependencies (optional)
pytest==7.4.3
pytest-flask==1.3.0
coverage==7.3.2

# Production Server (optional)
gunicorn==21.2.0
root@srv889400:/opt/EMMAR-DELIVERY# cat .env
# Emar Delivery Arabic App - Environment Configuration
# Copy this file to .env and configure for your environment

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_HOST=127.0.0.1
FLASK_PORT=1111
FLASK_USE_HTTPS=False

# Security Configuration
FLASK_SECRET_KEY=your-super-secret-key-here-change-this-in-production
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD_HASH=your-bcrypt-hashed-password-here

# Session Security
WTF_CSRF_SECRET_KEY=your-csrf-secret-key-here

# Rate Limiting Configuration (will be used in Priority 2)
RATELIMIT_STORAGE_URL=memory://
RATELIMIT_DEFAULT=100 per hour

# File Upload Security (will be used in Priority 3)
MAX_CONTENT_LENGTH=15728640
UPLOAD_FOLDER=uploads
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png,webp,docx,xlsx

# Production Security Headers
FORCE_HTTPS=False
HSTS_MAX_AGE=31536000

# Database Configuration (for future migration)
# DATABASE_URL=postgresql://user:password@localhost/emar_delivery

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/emar_delivery.log

# Backup Configuration
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP_ENABLED=True
root@srv889400:/opt/EMMAR-DELIVERY# nano Dockerfile
root@srv889400:/opt/EMMAR-DELIVERY# nano Dockerfile
root@srv889400:/opt/EMMAR-DELIVERY# nano docker-compose.yml
root@srv889400:/opt/EMMAR-DELIVERY# ^[[200~docker-compose up -d --build~
Traceback (most recent call last):
  File "/usr/lib/command-not-found", line 28, in <module>
    from CommandNotFound import CommandNotFound
  File "/usr/lib/python3/dist-packages/CommandNotFound/CommandNotFound.py", line 19, in <module>
    from CommandNotFound.db.db import SqliteDatabase
  File "/usr/lib/python3/dist-packages/CommandNotFound/db/db.py", line 5, in <module>
    import apt_pkg
ModuleNotFoundError: No module named 'apt_pkg'
root@srv889400:/opt/EMMAR-DELIVERY# docker-compose up -d --build
Creating network "emmar-delivery_emmar-network" with driver "bridge"
Creating volume "emmar-delivery_emmar_data" with default driver
Creating volume "emmar-delivery_emmar_logs" with default driver
Building emmar-delivery
DEPRECATED: The legacy builder is deprecated and will be removed in a future release.
            Install the buildx component to build images with BuildKit:
            https://docs.docker.com/go/buildx/

invalid argument "EMMAR-DELIVERY" for "-t, --tag" flag: invalid reference format: repository name (library/EMMAR-DELIVERY) must be lowercase
See 'docker build --help'.
ERROR: Service 'emmar-delivery' failed to build : Build failed
root@srv889400:/opt/EMMAR-DELIVERY# nano docker-compose.yml
root@srv889400:/opt/EMMAR-DELIVERY# docker-compose up -d --build
Building emmar-delivery
DEPRECATED: The legacy builder is deprecated and will be removed in a future release.
            Install the buildx component to build images with BuildKit:
            https://docs.docker.com/go/buildx/

Sending build context to Docker daemon   14.1MB
Step 1/13 : FROM python:3.11-slim
 ---> f3bfd8e9386c
Step 2/13 : WORKDIR /app
 ---> Using cache
 ---> 8b37d55dee4c
Step 3/13 : RUN apt-get update && apt-get install -y     gcc     libmagic1     && rm -rf /var/lib/apt/lists/*
 ---> Running in 20513145dec2
Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]
Get:2 http://deb.debian.org/debian bookworm-updates InRelease [55.4 kB]
Get:3 http://deb.debian.org/debian-security bookworm-security InRelease [48.0 kB]
Get:4 http://deb.debian.org/debian bookworm/main amd64 Packages [8791 kB]
Get:5 http://deb.debian.org/debian bookworm-updates/main amd64 Packages [6924 B]
Get:6 http://deb.debian.org/debian-security bookworm-security/main amd64 Packages [277 kB]
Fetched 9330 kB in 1s (6513 kB/s)
Reading package lists...
Reading package lists...
Building dependency tree...
Reading state information...
The following additional packages will be installed:
  binutils binutils-common binutils-x86-64-linux-gnu cpp cpp-12
  fontconfig-config fonts-dejavu-core gcc-12 libabsl20220623 libaom3 libasan8
  libatomic1 libavif15 libbinutils libbrotli1 libbsd0 libc-bin libc-dev-bin
  libc-devtools libc6 libc6-dev libcc1-0 libcrypt-dev libctf-nobfd0 libctf0
  libdav1d6 libde265-0 libdeflate0 libexpat1 libfontconfig1 libfreetype6
  libgav1-1 libgcc-12-dev libgd3 libgomp1 libgprofng0 libheif1 libisl23
  libitm1 libjansson4 libjbig0 libjpeg62-turbo liblerc4 liblsan0 libmagic-mgc
  libmpc3 libmpfr6 libnsl-dev libnuma1 libpng16-16 libquadmath0 librav1e0
  libsvtav1enc1 libtiff6 libtirpc-dev libtsan2 libubsan1 libwebp7 libx11-6
  libx11-data libx265-199 libxau6 libxcb1 libxdmcp6 libxpm4 libyuv0
  linux-libc-dev manpages manpages-dev rpcsvc-proto
Suggested packages:
  binutils-doc cpp-doc gcc-12-locales cpp-12-doc gcc-multilib make autoconf
  automake libtool flex bison gdb gcc-doc gcc-12-multilib gcc-12-doc glibc-doc
  libc-l10n locales libnss-nis libnss-nisplus libgd-tools file man-browser
The following NEW packages will be installed:
  binutils binutils-common binutils-x86-64-linux-gnu cpp cpp-12
  fontconfig-config fonts-dejavu-core gcc gcc-12 libabsl20220623 libaom3
  libasan8 libatomic1 libavif15 libbinutils libbrotli1 libbsd0 libc-dev-bin
  libc-devtools libc6-dev libcc1-0 libcrypt-dev libctf-nobfd0 libctf0
  libdav1d6 libde265-0 libdeflate0 libexpat1 libfontconfig1 libfreetype6
  libgav1-1 libgcc-12-dev libgd3 libgomp1 libgprofng0 libheif1 libisl23
  libitm1 libjansson4 libjbig0 libjpeg62-turbo liblerc4 liblsan0 libmagic-mgc
  libmagic1 libmpc3 libmpfr6 libnsl-dev libnuma1 libpng16-16 libquadmath0
  librav1e0 libsvtav1enc1 libtiff6 libtirpc-dev libtsan2 libubsan1 libwebp7
  libx11-6 libx11-data libx265-199 libxau6 libxcb1 libxdmcp6 libxpm4 libyuv0
  linux-libc-dev manpages manpages-dev rpcsvc-proto
The following packages will be upgraded:
  libc-bin libc6
2 upgraded, 70 newly installed, 0 to remove and 21 not upgraded.
Need to get 70.9 MB of archives.
After this operation, 268 MB of additional disk space will be used.
Get:1 http://deb.debian.org/debian bookworm/main amd64 libc6 amd64 2.36-9+deb12u13 [2758 kB]
Get:2 http://deb.debian.org/debian bookworm/main amd64 libc-bin amd64 2.36-9+deb12u13 [609 kB]
Get:3 http://deb.debian.org/debian bookworm/main amd64 manpages all 6.03-2 [1332 kB]
Get:4 http://deb.debian.org/debian bookworm/main amd64 binutils-common amd64 2.40-2 [2487 kB]
Get:5 http://deb.debian.org/debian bookworm/main amd64 libbinutils amd64 2.40-2 [572 kB]
Get:6 http://deb.debian.org/debian bookworm/main amd64 libctf-nobfd0 amd64 2.40-2 [153 kB]
Get:7 http://deb.debian.org/debian bookworm/main amd64 libctf0 amd64 2.40-2 [89.8 kB]
Get:8 http://deb.debian.org/debian bookworm/main amd64 libgprofng0 amd64 2.40-2 [812 kB]
Get:9 http://deb.debian.org/debian bookworm/main amd64 libjansson4 amd64 2.14-2 [40.8 kB]
Get:10 http://deb.debian.org/debian bookworm/main amd64 binutils-x86-64-linux-gnu amd64 2.40-2 [2246 kB]
Get:11 http://deb.debian.org/debian bookworm/main amd64 binutils amd64 2.40-2 [65.0 kB]
Get:12 http://deb.debian.org/debian bookworm/main amd64 libisl23 amd64 0.25-1.1 [683 kB]
Get:13 http://deb.debian.org/debian bookworm/main amd64 libmpfr6 amd64 4.2.0-1 [701 kB]
Get:14 http://deb.debian.org/debian bookworm/main amd64 libmpc3 amd64 1.3.1-1 [51.5 kB]
Get:15 http://deb.debian.org/debian bookworm/main amd64 cpp-12 amd64 12.2.0-14+deb12u1 [9768 kB]
Get:16 http://deb.debian.org/debian bookworm/main amd64 cpp amd64 4:12.2.0-3 [6836 B]
Get:17 http://deb.debian.org/debian bookworm/main amd64 fonts-dejavu-core all 2.37-6 [1068 kB]
Get:18 http://deb.debian.org/debian bookworm/main amd64 fontconfig-config amd64 2.14.1-4 [315 kB]
Get:19 http://deb.debian.org/debian bookworm/main amd64 libcc1-0 amd64 12.2.0-14+deb12u1 [41.7 kB]
Get:20 http://deb.debian.org/debian bookworm/main amd64 libgomp1 amd64 12.2.0-14+deb12u1 [116 kB]
Get:21 http://deb.debian.org/debian bookworm/main amd64 libitm1 amd64 12.2.0-14+deb12u1 [26.1 kB]
Get:22 http://deb.debian.org/debian bookworm/main amd64 libatomic1 amd64 12.2.0-14+deb12u1 [9376 B]
Get:23 http://deb.debian.org/debian bookworm/main amd64 libasan8 amd64 12.2.0-14+deb12u1 [2193 kB]
Get:24 http://deb.debian.org/debian bookworm/main amd64 liblsan0 amd64 12.2.0-14+deb12u1 [969 kB]
Get:25 http://deb.debian.org/debian bookworm/main amd64 libtsan2 amd64 12.2.0-14+deb12u1 [2197 kB]
Get:26 http://deb.debian.org/debian bookworm/main amd64 libubsan1 amd64 12.2.0-14+deb12u1 [883 kB]
Get:27 http://deb.debian.org/debian bookworm/main amd64 libquadmath0 amd64 12.2.0-14+deb12u1 [145 kB]
Get:28 http://deb.debian.org/debian bookworm/main amd64 libgcc-12-dev amd64 12.2.0-14+deb12u1 [2437 kB]
Get:29 http://deb.debian.org/debian bookworm/main amd64 gcc-12 amd64 12.2.0-14+deb12u1 [19.3 MB]
Get:30 http://deb.debian.org/debian bookworm/main amd64 gcc amd64 4:12.2.0-3 [5216 B]
Get:31 http://deb.debian.org/debian bookworm/main amd64 libabsl20220623 amd64 20220623.1-1+deb12u2 [391 kB]
Get:32 http://deb.debian.org/debian bookworm/main amd64 libaom3 amd64 3.6.0-1+deb12u2 [1850 kB]
Get:33 http://deb.debian.org/debian bookworm/main amd64 libdav1d6 amd64 1.0.0-2+deb12u1 [513 kB]
Get:34 http://deb.debian.org/debian bookworm/main amd64 libgav1-1 amd64 0.18.0-1+b1 [332 kB]
Get:35 http://deb.debian.org/debian bookworm/main amd64 librav1e0 amd64 0.5.1-6 [763 kB]
Get:36 http://deb.debian.org/debian bookworm/main amd64 libsvtav1enc1 amd64 1.4.1+dfsg-1 [2121 kB]
Get:37 http://deb.debian.org/debian bookworm/main amd64 libjpeg62-turbo amd64 1:2.1.5-2 [166 kB]
Get:38 http://deb.debian.org/debian bookworm/main amd64 libyuv0 amd64 0.0~git20230123.b2528b0-1 [168 kB]
Get:39 http://deb.debian.org/debian bookworm/main amd64 libavif15 amd64 0.11.1-1+deb12u1 [94.4 kB]
Get:40 http://deb.debian.org/debian bookworm/main amd64 libbrotli1 amd64 1.0.9-2+b6 [275 kB]
Get:41 http://deb.debian.org/debian bookworm/main amd64 libbsd0 amd64 0.11.7-2 [117 kB]
Get:42 http://deb.debian.org/debian bookworm/main amd64 libc-dev-bin amd64 2.36-9+deb12u13 [47.4 kB]
Get:43 http://deb.debian.org/debian bookworm/main amd64 libexpat1 amd64 2.5.0-1+deb12u2 [99.9 kB]
Get:44 http://deb.debian.org/debian bookworm/main amd64 libpng16-16 amd64 1.6.39-2 [276 kB]
Get:45 http://deb.debian.org/debian bookworm/main amd64 libfreetype6 amd64 2.12.1+dfsg-5+deb12u4 [398 kB]
Get:46 http://deb.debian.org/debian bookworm/main amd64 libfontconfig1 amd64 2.14.1-4 [386 kB]
Get:47 http://deb.debian.org/debian bookworm/main amd64 libde265-0 amd64 1.0.11-1+deb12u2 [185 kB]
Get:48 http://deb.debian.org/debian bookworm/main amd64 libnuma1 amd64 2.0.16-1 [21.0 kB]
Get:49 http://deb.debian.org/debian bookworm/main amd64 libx265-199 amd64 3.5-2+b1 [1150 kB]
Get:50 http://deb.debian.org/debian bookworm/main amd64 libheif1 amd64 1.15.1-1+deb12u1 [215 kB]
Get:51 http://deb.debian.org/debian bookworm/main amd64 libdeflate0 amd64 1.14-1 [61.4 kB]
Get:52 http://deb.debian.org/debian bookworm/main amd64 libjbig0 amd64 2.1-6.1 [31.7 kB]
Get:53 http://deb.debian.org/debian bookworm/main amd64 liblerc4 amd64 4.0.0+ds-2 [170 kB]
Get:54 http://deb.debian.org/debian bookworm/main amd64 libwebp7 amd64 1.2.4-0.2+deb12u1 [286 kB]
Get:55 http://deb.debian.org/debian bookworm/main amd64 libtiff6 amd64 4.5.0-6+deb12u2 [316 kB]
Get:56 http://deb.debian.org/debian bookworm/main amd64 libxau6 amd64 1:1.0.9-1 [19.7 kB]
Get:57 http://deb.debian.org/debian bookworm/main amd64 libxdmcp6 amd64 1:1.1.2-3 [26.3 kB]
Get:58 http://deb.debian.org/debian bookworm/main amd64 libxcb1 amd64 1.15-1 [144 kB]
Get:59 http://deb.debian.org/debian bookworm/main amd64 libx11-data all 2:1.8.4-2+deb12u2 [292 kB]
Get:60 http://deb.debian.org/debian bookworm/main amd64 libx11-6 amd64 2:1.8.4-2+deb12u2 [760 kB]
Get:61 http://deb.debian.org/debian bookworm/main amd64 libxpm4 amd64 1:3.5.12-1.1+deb12u1 [48.6 kB]
Get:62 http://deb.debian.org/debian bookworm/main amd64 libgd3 amd64 2.3.3-9 [124 kB]
Get:63 http://deb.debian.org/debian bookworm/main amd64 libc-devtools amd64 2.36-9+deb12u13 [55.0 kB]
Get:64 http://deb.debian.org/debian bookworm/main amd64 linux-libc-dev amd64 6.1.148-1 [2176 kB]
Get:65 http://deb.debian.org/debian bookworm/main amd64 libcrypt-dev amd64 1:4.4.33-2 [118 kB]
Get:66 http://deb.debian.org/debian bookworm/main amd64 libtirpc-dev amd64 1.3.3+ds-1 [191 kB]
Get:67 http://deb.debian.org/debian bookworm/main amd64 libnsl-dev amd64 1.3.0-2 [66.4 kB]
Get:68 http://deb.debian.org/debian bookworm/main amd64 rpcsvc-proto amd64 1.4.3-1 [63.3 kB]
Get:69 http://deb.debian.org/debian bookworm/main amd64 libc6-dev amd64 2.36-9+deb12u13 [1904 kB]
Get:70 http://deb.debian.org/debian bookworm/main amd64 libmagic-mgc amd64 1:5.44-3 [305 kB]
Get:71 http://deb.debian.org/debian bookworm/main amd64 libmagic1 amd64 1:5.44-3 [104 kB]
Get:72 http://deb.debian.org/debian bookworm/main amd64 manpages-dev all 6.03-2 [2030 kB]
debconf: delaying package configuration, since apt-utils is not installed
Fetched 70.9 MB in 1s (110 MB/s)
(Reading database ... 6688 files and directories currently installed.)
Preparing to unpack .../libc6_2.36-9+deb12u13_amd64.deb ...
debconf: unable to initialize frontend: Dialog
debconf: (TERM is not set, so the dialog frontend is not usable.)
debconf: falling back to frontend: Readline
debconf: unable to initialize frontend: Readline
debconf: (Can't locate Term/ReadLine.pm in @INC (you may need to install the Term::ReadLine module) (@INC contains: /etc/perl /usr/local/lib/x86_64-linux-gnu/perl/5.36.0 /usr/local/share/perl/5.36.0 /usr/lib/x86_64-linux-gnu/perl5/5.36 /usr/share/perl5 /usr/lib/x86_64-linux-gnu/perl-base /usr/lib/x86_64-linux-gnu/perl/5.36 /usr/share/perl/5.36 /usr/local/lib/site_perl) at /usr/share/perl5/Debconf/FrontEnd/Readline.pm line 7.)
debconf: falling back to frontend: Teletype
Unpacking libc6:amd64 (2.36-9+deb12u13) over (2.36-9+deb12u10) ...
Setting up libc6:amd64 (2.36-9+deb12u13) ...
debconf: unable to initialize frontend: Dialog
debconf: (TERM is not set, so the dialog frontend is not usable.)
debconf: falling back to frontend: Readline
debconf: unable to initialize frontend: Readline
debconf: (Can't locate Term/ReadLine.pm in @INC (you may need to install the Term::ReadLine module) (@INC contains: /etc/perl /usr/local/lib/x86_64-linux-gnu/perl/5.36.0 /usr/local/share/perl/5.36.0 /usr/lib/x86_64-linux-gnu/perl5/5.36 /usr/share/perl5 /usr/lib/x86_64-linux-gnu/perl-base /usr/lib/x86_64-linux-gnu/perl/5.36 /usr/share/perl/5.36 /usr/local/lib/site_perl) at /usr/share/perl5/Debconf/FrontEnd/Readline.pm line 7.)
debconf: falling back to frontend: Teletype
(Reading database ... 6688 files and directories currently installed.)
Preparing to unpack .../libc-bin_2.36-9+deb12u13_amd64.deb ...
Unpacking libc-bin (2.36-9+deb12u13) over (2.36-9+deb12u10) ...
Setting up libc-bin (2.36-9+deb12u13) ...
Selecting previously unselected package manpages.
(Reading database ... 6688 files and directories currently installed.)
Preparing to unpack .../00-manpages_6.03-2_all.deb ...
Unpacking manpages (6.03-2) ...
Selecting previously unselected package binutils-common:amd64.
Preparing to unpack .../01-binutils-common_2.40-2_amd64.deb ...
Unpacking binutils-common:amd64 (2.40-2) ...
Selecting previously unselected package libbinutils:amd64.
Preparing to unpack .../02-libbinutils_2.40-2_amd64.deb ...
Unpacking libbinutils:amd64 (2.40-2) ...
Selecting previously unselected package libctf-nobfd0:amd64.
Preparing to unpack .../03-libctf-nobfd0_2.40-2_amd64.deb ...
Unpacking libctf-nobfd0:amd64 (2.40-2) ...
Selecting previously unselected package libctf0:amd64.
Preparing to unpack .../04-libctf0_2.40-2_amd64.deb ...
Unpacking libctf0:amd64 (2.40-2) ...
Selecting previously unselected package libgprofng0:amd64.
Preparing to unpack .../05-libgprofng0_2.40-2_amd64.deb ...
Unpacking libgprofng0:amd64 (2.40-2) ...
Selecting previously unselected package libjansson4:amd64.
Preparing to unpack .../06-libjansson4_2.14-2_amd64.deb ...
Unpacking libjansson4:amd64 (2.14-2) ...
Selecting previously unselected package binutils-x86-64-linux-gnu.
Preparing to unpack .../07-binutils-x86-64-linux-gnu_2.40-2_amd64.deb ...
Unpacking binutils-x86-64-linux-gnu (2.40-2) ...
Selecting previously unselected package binutils.
Preparing to unpack .../08-binutils_2.40-2_amd64.deb ...
Unpacking binutils (2.40-2) ...
Selecting previously unselected package libisl23:amd64.
Preparing to unpack .../09-libisl23_0.25-1.1_amd64.deb ...
Unpacking libisl23:amd64 (0.25-1.1) ...
Selecting previously unselected package libmpfr6:amd64.
Preparing to unpack .../10-libmpfr6_4.2.0-1_amd64.deb ...
Unpacking libmpfr6:amd64 (4.2.0-1) ...
Selecting previously unselected package libmpc3:amd64.
Preparing to unpack .../11-libmpc3_1.3.1-1_amd64.deb ...
Unpacking libmpc3:amd64 (1.3.1-1) ...
Selecting previously unselected package cpp-12.
Preparing to unpack .../12-cpp-12_12.2.0-14+deb12u1_amd64.deb ...
Unpacking cpp-12 (12.2.0-14+deb12u1) ...
Selecting previously unselected package cpp.
Preparing to unpack .../13-cpp_4%3a12.2.0-3_amd64.deb ...
Unpacking cpp (4:12.2.0-3) ...
Selecting previously unselected package fonts-dejavu-core.
Preparing to unpack .../14-fonts-dejavu-core_2.37-6_all.deb ...
Unpacking fonts-dejavu-core (2.37-6) ...
Selecting previously unselected package fontconfig-config.
Preparing to unpack .../15-fontconfig-config_2.14.1-4_amd64.deb ...
Unpacking fontconfig-config (2.14.1-4) ...
Selecting previously unselected package libcc1-0:amd64.
Preparing to unpack .../16-libcc1-0_12.2.0-14+deb12u1_amd64.deb ...
Unpacking libcc1-0:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package libgomp1:amd64.
Preparing to unpack .../17-libgomp1_12.2.0-14+deb12u1_amd64.deb ...
Unpacking libgomp1:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package libitm1:amd64.
Preparing to unpack .../18-libitm1_12.2.0-14+deb12u1_amd64.deb ...
Unpacking libitm1:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package libatomic1:amd64.
Preparing to unpack .../19-libatomic1_12.2.0-14+deb12u1_amd64.deb ...
Unpacking libatomic1:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package libasan8:amd64.
Preparing to unpack .../20-libasan8_12.2.0-14+deb12u1_amd64.deb ...
Unpacking libasan8:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package liblsan0:amd64.
Preparing to unpack .../21-liblsan0_12.2.0-14+deb12u1_amd64.deb ...
Unpacking liblsan0:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package libtsan2:amd64.
Preparing to unpack .../22-libtsan2_12.2.0-14+deb12u1_amd64.deb ...
Unpacking libtsan2:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package libubsan1:amd64.
Preparing to unpack .../23-libubsan1_12.2.0-14+deb12u1_amd64.deb ...
Unpacking libubsan1:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package libquadmath0:amd64.
Preparing to unpack .../24-libquadmath0_12.2.0-14+deb12u1_amd64.deb ...
Unpacking libquadmath0:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package libgcc-12-dev:amd64.
Preparing to unpack .../25-libgcc-12-dev_12.2.0-14+deb12u1_amd64.deb ...
Unpacking libgcc-12-dev:amd64 (12.2.0-14+deb12u1) ...
Selecting previously unselected package gcc-12.
Preparing to unpack .../26-gcc-12_12.2.0-14+deb12u1_amd64.deb ...
Unpacking gcc-12 (12.2.0-14+deb12u1) ...
Selecting previously unselected package gcc.
Preparing to unpack .../27-gcc_4%3a12.2.0-3_amd64.deb ...
Unpacking gcc (4:12.2.0-3) ...
Selecting previously unselected package libabsl20220623:amd64.
Preparing to unpack .../28-libabsl20220623_20220623.1-1+deb12u2_amd64.deb ...
Unpacking libabsl20220623:amd64 (20220623.1-1+deb12u2) ...
Selecting previously unselected package libaom3:amd64.
Preparing to unpack .../29-libaom3_3.6.0-1+deb12u2_amd64.deb ...
Unpacking libaom3:amd64 (3.6.0-1+deb12u2) ...
Selecting previously unselected package libdav1d6:amd64.
Preparing to unpack .../30-libdav1d6_1.0.0-2+deb12u1_amd64.deb ...
Unpacking libdav1d6:amd64 (1.0.0-2+deb12u1) ...
Selecting previously unselected package libgav1-1:amd64.
Preparing to unpack .../31-libgav1-1_0.18.0-1+b1_amd64.deb ...
Unpacking libgav1-1:amd64 (0.18.0-1+b1) ...
Selecting previously unselected package librav1e0:amd64.
Preparing to unpack .../32-librav1e0_0.5.1-6_amd64.deb ...
Unpacking librav1e0:amd64 (0.5.1-6) ...
Selecting previously unselected package libsvtav1enc1:amd64.
Preparing to unpack .../33-libsvtav1enc1_1.4.1+dfsg-1_amd64.deb ...
Unpacking libsvtav1enc1:amd64 (1.4.1+dfsg-1) ...
Selecting previously unselected package libjpeg62-turbo:amd64.
Preparing to unpack .../34-libjpeg62-turbo_1%3a2.1.5-2_amd64.deb ...
Unpacking libjpeg62-turbo:amd64 (1:2.1.5-2) ...
Selecting previously unselected package libyuv0:amd64.
Preparing to unpack .../35-libyuv0_0.0~git20230123.b2528b0-1_amd64.deb ...
Unpacking libyuv0:amd64 (0.0~git20230123.b2528b0-1) ...
Selecting previously unselected package libavif15:amd64.
Preparing to unpack .../36-libavif15_0.11.1-1+deb12u1_amd64.deb ...
Unpacking libavif15:amd64 (0.11.1-1+deb12u1) ...
Selecting previously unselected package libbrotli1:amd64.
Preparing to unpack .../37-libbrotli1_1.0.9-2+b6_amd64.deb ...
Unpacking libbrotli1:amd64 (1.0.9-2+b6) ...
Selecting previously unselected package libbsd0:amd64.
Preparing to unpack .../38-libbsd0_0.11.7-2_amd64.deb ...
Unpacking libbsd0:amd64 (0.11.7-2) ...
Selecting previously unselected package libc-dev-bin.
Preparing to unpack .../39-libc-dev-bin_2.36-9+deb12u13_amd64.deb ...
Unpacking libc-dev-bin (2.36-9+deb12u13) ...
Selecting previously unselected package libexpat1:amd64.
Preparing to unpack .../40-libexpat1_2.5.0-1+deb12u2_amd64.deb ...
Unpacking libexpat1:amd64 (2.5.0-1+deb12u2) ...
Selecting previously unselected package libpng16-16:amd64.
Preparing to unpack .../41-libpng16-16_1.6.39-2_amd64.deb ...
Unpacking libpng16-16:amd64 (1.6.39-2) ...
Selecting previously unselected package libfreetype6:amd64.
Preparing to unpack .../42-libfreetype6_2.12.1+dfsg-5+deb12u4_amd64.deb ...
Unpacking libfreetype6:amd64 (2.12.1+dfsg-5+deb12u4) ...
Selecting previously unselected package libfontconfig1:amd64.
Preparing to unpack .../43-libfontconfig1_2.14.1-4_amd64.deb ...
Unpacking libfontconfig1:amd64 (2.14.1-4) ...
Selecting previously unselected package libde265-0:amd64.
Preparing to unpack .../44-libde265-0_1.0.11-1+deb12u2_amd64.deb ...
Unpacking libde265-0:amd64 (1.0.11-1+deb12u2) ...
Selecting previously unselected package libnuma1:amd64.
Preparing to unpack .../45-libnuma1_2.0.16-1_amd64.deb ...
Unpacking libnuma1:amd64 (2.0.16-1) ...
Selecting previously unselected package libx265-199:amd64.
Preparing to unpack .../46-libx265-199_3.5-2+b1_amd64.deb ...
Unpacking libx265-199:amd64 (3.5-2+b1) ...
Selecting previously unselected package libheif1:amd64.
Preparing to unpack .../47-libheif1_1.15.1-1+deb12u1_amd64.deb ...
Unpacking libheif1:amd64 (1.15.1-1+deb12u1) ...
Selecting previously unselected package libdeflate0:amd64.
Preparing to unpack .../48-libdeflate0_1.14-1_amd64.deb ...
Unpacking libdeflate0:amd64 (1.14-1) ...
Selecting previously unselected package libjbig0:amd64.
Preparing to unpack .../49-libjbig0_2.1-6.1_amd64.deb ...
Unpacking libjbig0:amd64 (2.1-6.1) ...
Selecting previously unselected package liblerc4:amd64.
Preparing to unpack .../50-liblerc4_4.0.0+ds-2_amd64.deb ...
Unpacking liblerc4:amd64 (4.0.0+ds-2) ...
Selecting previously unselected package libwebp7:amd64.
Preparing to unpack .../51-libwebp7_1.2.4-0.2+deb12u1_amd64.deb ...
Unpacking libwebp7:amd64 (1.2.4-0.2+deb12u1) ...
Selecting previously unselected package libtiff6:amd64.
Preparing to unpack .../52-libtiff6_4.5.0-6+deb12u2_amd64.deb ...
Unpacking libtiff6:amd64 (4.5.0-6+deb12u2) ...
Selecting previously unselected package libxau6:amd64.
Preparing to unpack .../53-libxau6_1%3a1.0.9-1_amd64.deb ...
Unpacking libxau6:amd64 (1:1.0.9-1) ...
Selecting previously unselected package libxdmcp6:amd64.
Preparing to unpack .../54-libxdmcp6_1%3a1.1.2-3_amd64.deb ...
Unpacking libxdmcp6:amd64 (1:1.1.2-3) ...
Selecting previously unselected package libxcb1:amd64.
Preparing to unpack .../55-libxcb1_1.15-1_amd64.deb ...
Unpacking libxcb1:amd64 (1.15-1) ...
Selecting previously unselected package libx11-data.
Preparing to unpack .../56-libx11-data_2%3a1.8.4-2+deb12u2_all.deb ...
Unpacking libx11-data (2:1.8.4-2+deb12u2) ...
Selecting previously unselected package libx11-6:amd64.
Preparing to unpack .../57-libx11-6_2%3a1.8.4-2+deb12u2_amd64.deb ...
Unpacking libx11-6:amd64 (2:1.8.4-2+deb12u2) ...
Selecting previously unselected package libxpm4:amd64.
Preparing to unpack .../58-libxpm4_1%3a3.5.12-1.1+deb12u1_amd64.deb ...
Unpacking libxpm4:amd64 (1:3.5.12-1.1+deb12u1) ...
Selecting previously unselected package libgd3:amd64.
Preparing to unpack .../59-libgd3_2.3.3-9_amd64.deb ...
Unpacking libgd3:amd64 (2.3.3-9) ...
Selecting previously unselected package libc-devtools.
Preparing to unpack .../60-libc-devtools_2.36-9+deb12u13_amd64.deb ...
Unpacking libc-devtools (2.36-9+deb12u13) ...
Selecting previously unselected package linux-libc-dev:amd64.
Preparing to unpack .../61-linux-libc-dev_6.1.148-1_amd64.deb ...
Unpacking linux-libc-dev:amd64 (6.1.148-1) ...
Selecting previously unselected package libcrypt-dev:amd64.
Preparing to unpack .../62-libcrypt-dev_1%3a4.4.33-2_amd64.deb ...
Unpacking libcrypt-dev:amd64 (1:4.4.33-2) ...
Selecting previously unselected package libtirpc-dev:amd64.
Preparing to unpack .../63-libtirpc-dev_1.3.3+ds-1_amd64.deb ...
Unpacking libtirpc-dev:amd64 (1.3.3+ds-1) ...
Selecting previously unselected package libnsl-dev:amd64.
Preparing to unpack .../64-libnsl-dev_1.3.0-2_amd64.deb ...
Unpacking libnsl-dev:amd64 (1.3.0-2) ...
Selecting previously unselected package rpcsvc-proto.
Preparing to unpack .../65-rpcsvc-proto_1.4.3-1_amd64.deb ...
Unpacking rpcsvc-proto (1.4.3-1) ...
Selecting previously unselected package libc6-dev:amd64.
Preparing to unpack .../66-libc6-dev_2.36-9+deb12u13_amd64.deb ...
Unpacking libc6-dev:amd64 (2.36-9+deb12u13) ...
Selecting previously unselected package libmagic-mgc.
Preparing to unpack .../67-libmagic-mgc_1%3a5.44-3_amd64.deb ...
Unpacking libmagic-mgc (1:5.44-3) ...
Selecting previously unselected package libmagic1:amd64.
Preparing to unpack .../68-libmagic1_1%3a5.44-3_amd64.deb ...
Unpacking libmagic1:amd64 (1:5.44-3) ...
Selecting previously unselected package manpages-dev.
Preparing to unpack .../69-manpages-dev_6.03-2_all.deb ...
Unpacking manpages-dev (6.03-2) ...
Setting up libexpat1:amd64 (2.5.0-1+deb12u2) ...
Setting up libaom3:amd64 (3.6.0-1+deb12u2) ...
Setting up libabsl20220623:amd64 (20220623.1-1+deb12u2) ...
Setting up libxau6:amd64 (1:1.0.9-1) ...
Setting up liblerc4:amd64 (4.0.0+ds-2) ...
Setting up libmagic-mgc (1:5.44-3) ...
Setting up manpages (6.03-2) ...
Setting up libbrotli1:amd64 (1.0.9-2+b6) ...
Setting up binutils-common:amd64 (2.40-2) ...
Setting up libmagic1:amd64 (1:5.44-3) ...
Setting up libdeflate0:amd64 (1.14-1) ...
Setting up linux-libc-dev:amd64 (6.1.148-1) ...
Setting up libctf-nobfd0:amd64 (2.40-2) ...
Setting up libsvtav1enc1:amd64 (1.4.1+dfsg-1) ...
Setting up libgomp1:amd64 (12.2.0-14+deb12u1) ...
Setting up libjbig0:amd64 (2.1-6.1) ...
Setting up librav1e0:amd64 (0.5.1-6) ...
Setting up libjansson4:amd64 (2.14-2) ...
Setting up libtirpc-dev:amd64 (1.3.3+ds-1) ...
Setting up rpcsvc-proto (1.4.3-1) ...
Setting up libjpeg62-turbo:amd64 (1:2.1.5-2) ...
Setting up libx11-data (2:1.8.4-2+deb12u2) ...
Setting up libmpfr6:amd64 (4.2.0-1) ...
Setting up libquadmath0:amd64 (12.2.0-14+deb12u1) ...
Setting up libpng16-16:amd64 (1.6.39-2) ...
Setting up libmpc3:amd64 (1.3.1-1) ...
Setting up libatomic1:amd64 (12.2.0-14+deb12u1) ...
Setting up fonts-dejavu-core (2.37-6) ...
Setting up libgav1-1:amd64 (0.18.0-1+b1) ...
Setting up libdav1d6:amd64 (1.0.0-2+deb12u1) ...
Setting up libwebp7:amd64 (1.2.4-0.2+deb12u1) ...
Setting up libubsan1:amd64 (12.2.0-14+deb12u1) ...
Setting up libnuma1:amd64 (2.0.16-1) ...
Setting up libnsl-dev:amd64 (1.3.0-2) ...
Setting up libcrypt-dev:amd64 (1:4.4.33-2) ...
Setting up libtiff6:amd64 (4.5.0-6+deb12u2) ...
Setting up libasan8:amd64 (12.2.0-14+deb12u1) ...
Setting up libtsan2:amd64 (12.2.0-14+deb12u1) ...
Setting up libbinutils:amd64 (2.40-2) ...
Setting up libisl23:amd64 (0.25-1.1) ...
Setting up libde265-0:amd64 (1.0.11-1+deb12u2) ...
Setting up libc-dev-bin (2.36-9+deb12u13) ...
Setting up libbsd0:amd64 (0.11.7-2) ...
Setting up libyuv0:amd64 (0.0~git20230123.b2528b0-1) ...
Setting up libcc1-0:amd64 (12.2.0-14+deb12u1) ...
Setting up liblsan0:amd64 (12.2.0-14+deb12u1) ...
Setting up libitm1:amd64 (12.2.0-14+deb12u1) ...
Setting up libctf0:amd64 (2.40-2) ...
Setting up manpages-dev (6.03-2) ...
Setting up libxdmcp6:amd64 (1:1.1.2-3) ...
Setting up cpp-12 (12.2.0-14+deb12u1) ...
Setting up libxcb1:amd64 (1.15-1) ...
Setting up libavif15:amd64 (0.11.1-1+deb12u1) ...
Setting up fontconfig-config (2.14.1-4) ...
debconf: unable to initialize frontend: Dialog
debconf: (TERM is not set, so the dialog frontend is not usable.)
debconf: falling back to frontend: Readline
debconf: unable to initialize frontend: Readline
debconf: (Can't locate Term/ReadLine.pm in @INC (you may need to install the Term::ReadLine module) (@INC contains: /etc/perl /usr/local/lib/x86_64-linux-gnu/perl/5.36.0 /usr/local/share/perl/5.36.0 /usr/lib/x86_64-linux-gnu/perl5/5.36 /usr/share/perl5 /usr/lib/x86_64-linux-gnu/perl-base /usr/lib/x86_64-linux-gnu/perl/5.36 /usr/share/perl/5.36 /usr/local/lib/site_perl) at /usr/share/perl5/Debconf/FrontEnd/Readline.pm line 7.)
debconf: falling back to frontend: Teletype
Setting up libgprofng0:amd64 (2.40-2) ...
Setting up libfreetype6:amd64 (2.12.1+dfsg-5+deb12u4) ...
Setting up libgcc-12-dev:amd64 (12.2.0-14+deb12u1) ...
Setting up libx265-199:amd64 (3.5-2+b1) ...
Setting up cpp (4:12.2.0-3) ...
Setting up libc6-dev:amd64 (2.36-9+deb12u13) ...
Setting up libx11-6:amd64 (2:1.8.4-2+deb12u2) ...
Setting up libfontconfig1:amd64 (2.14.1-4) ...
Setting up binutils-x86-64-linux-gnu (2.40-2) ...
Setting up libxpm4:amd64 (1:3.5.12-1.1+deb12u1) ...
Setting up libheif1:amd64 (1.15.1-1+deb12u1) ...
Setting up binutils (2.40-2) ...
Setting up gcc-12 (12.2.0-14+deb12u1) ...
Setting up libgd3:amd64 (2.3.3-9) ...
Setting up libc-devtools (2.36-9+deb12u13) ...
Setting up gcc (4:12.2.0-3) ...
Processing triggers for libc-bin (2.36-9+deb12u13) ...
 ---> Removed intermediate container 20513145dec2
 ---> fbba4210312b
Step 4/13 : COPY requirements.txt .
 ---> 6b688fae8aed
Step 5/13 : RUN pip install --no-cache-dir -r requirements.txt
 ---> Running in 191a93c5cba5
Collecting Flask==3.0.0 (from -r requirements.txt (line 2))
  Downloading flask-3.0.0-py3-none-any.whl.metadata (3.6 kB)
Collecting Werkzeug==3.0.1 (from -r requirements.txt (line 3))
  Downloading werkzeug-3.0.1-py3-none-any.whl.metadata (4.1 kB)
Collecting Flask-CORS==4.0.0 (from -r requirements.txt (line 6))
  Downloading Flask_Cors-4.0.0-py2.py3-none-any.whl.metadata (5.4 kB)
Collecting Flask-Limiter==3.5.0 (from -r requirements.txt (line 7))
  Downloading Flask_Limiter-3.5.0-py3-none-any.whl.metadata (6.3 kB)
Collecting Flask-WTF==1.2.1 (from -r requirements.txt (line 8))
  Downloading flask_wtf-1.2.1-py3-none-any.whl.metadata (3.4 kB)
Collecting Flask-Talisman==1.1.0 (from -r requirements.txt (line 9))
  Downloading flask_talisman-1.1.0-py2.py3-none-any.whl.metadata (18 kB)
Collecting bcrypt==4.1.2 (from -r requirements.txt (line 12))
  Downloading bcrypt-4.1.2-cp39-abi3-manylinux_2_28_x86_64.whl.metadata (9.5 kB)
Collecting python-dotenv==1.0.0 (from -r requirements.txt (line 13))
  Downloading python_dotenv-1.0.0-py3-none-any.whl.metadata (21 kB)
Collecting python-dateutil==2.8.2 (from -r requirements.txt (line 16))
  Downloading python_dateutil-2.8.2-py2.py3-none-any.whl.metadata (8.2 kB)
Collecting openpyxl==3.1.2 (from -r requirements.txt (line 19))
  Downloading openpyxl-3.1.2-py2.py3-none-any.whl.metadata (2.5 kB)
Collecting python-magic==0.4.27 (from -r requirements.txt (line 20))
  Downloading python_magic-0.4.27-py2.py3-none-any.whl.metadata (5.8 kB)
Collecting pytest==7.4.3 (from -r requirements.txt (line 23))
  Downloading pytest-7.4.3-py3-none-any.whl.metadata (7.9 kB)
Collecting pytest-flask==1.3.0 (from -r requirements.txt (line 24))
  Downloading pytest_flask-1.3.0-py3-none-any.whl.metadata (14 kB)
Collecting coverage==7.3.2 (from -r requirements.txt (line 25))
  Downloading coverage-7.3.2-cp311-cp311-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (8.1 kB)
Collecting gunicorn==21.2.0 (from -r requirements.txt (line 28))
  Downloading gunicorn-21.2.0-py3-none-any.whl.metadata (4.1 kB)
Collecting Jinja2>=3.1.2 (from Flask==3.0.0->-r requirements.txt (line 2))
  Downloading jinja2-3.1.6-py3-none-any.whl.metadata (2.9 kB)
Collecting itsdangerous>=2.1.2 (from Flask==3.0.0->-r requirements.txt (line 2))
  Downloading itsdangerous-2.2.0-py3-none-any.whl.metadata (1.9 kB)
Collecting click>=8.1.3 (from Flask==3.0.0->-r requirements.txt (line 2))
  Downloading click-8.2.1-py3-none-any.whl.metadata (2.5 kB)
Collecting blinker>=1.6.2 (from Flask==3.0.0->-r requirements.txt (line 2))
  Downloading blinker-1.9.0-py3-none-any.whl.metadata (1.6 kB)
Collecting MarkupSafe>=2.1.1 (from Werkzeug==3.0.1->-r requirements.txt (line 3))
  Downloading MarkupSafe-3.0.2-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (4.0 kB)
Collecting limits>=2.8 (from Flask-Limiter==3.5.0->-r requirements.txt (line 7))
  Downloading limits-5.5.0-py3-none-any.whl.metadata (10 kB)
Collecting ordered-set<5,>4 (from Flask-Limiter==3.5.0->-r requirements.txt (line 7))
  Downloading ordered_set-4.1.0-py3-none-any.whl.metadata (5.3 kB)
Collecting rich<14,>=12 (from Flask-Limiter==3.5.0->-r requirements.txt (line 7))
  Downloading rich-13.9.4-py3-none-any.whl.metadata (18 kB)
Collecting typing-extensions>=4 (from Flask-Limiter==3.5.0->-r requirements.txt (line 7))
  Downloading typing_extensions-4.15.0-py3-none-any.whl.metadata (3.3 kB)
Collecting wtforms (from Flask-WTF==1.2.1->-r requirements.txt (line 8))
  Downloading wtforms-3.2.1-py3-none-any.whl.metadata (5.3 kB)
Collecting six>=1.5 (from python-dateutil==2.8.2->-r requirements.txt (line 16))
  Downloading six-1.17.0-py2.py3-none-any.whl.metadata (1.7 kB)
Collecting et-xmlfile (from openpyxl==3.1.2->-r requirements.txt (line 19))
  Downloading et_xmlfile-2.0.0-py3-none-any.whl.metadata (2.7 kB)
Collecting iniconfig (from pytest==7.4.3->-r requirements.txt (line 23))
  Downloading iniconfig-2.1.0-py3-none-any.whl.metadata (2.7 kB)
Collecting packaging (from pytest==7.4.3->-r requirements.txt (line 23))
  Downloading packaging-25.0-py3-none-any.whl.metadata (3.3 kB)
Collecting pluggy<2.0,>=0.12 (from pytest==7.4.3->-r requirements.txt (line 23))
  Downloading pluggy-1.6.0-py3-none-any.whl.metadata (4.8 kB)
Collecting deprecated>=1.2 (from limits>=2.8->Flask-Limiter==3.5.0->-r requirements.txt (line 7))
  Downloading Deprecated-1.2.18-py2.py3-none-any.whl.metadata (5.7 kB)
Collecting markdown-it-py>=2.2.0 (from rich<14,>=12->Flask-Limiter==3.5.0->-r requirements.txt (line 7))
  Downloading markdown_it_py-4.0.0-py3-none-any.whl.metadata (7.3 kB)
Collecting pygments<3.0.0,>=2.13.0 (from rich<14,>=12->Flask-Limiter==3.5.0->-r requirements.txt (line 7))
  Downloading pygments-2.19.2-py3-none-any.whl.metadata (2.5 kB)
Collecting wrapt<2,>=1.10 (from deprecated>=1.2->limits>=2.8->Flask-Limiter==3.5.0->-r requirements.txt (line 7))
  Downloading wrapt-1.17.3-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl.metadata (6.4 kB)
Collecting mdurl~=0.1 (from markdown-it-py>=2.2.0->rich<14,>=12->Flask-Limiter==3.5.0->-r requirements.txt (line 7))
  Downloading mdurl-0.1.2-py3-none-any.whl.metadata (1.6 kB)
Downloading flask-3.0.0-py3-none-any.whl (99 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 99.7/99.7 kB 41.0 MB/s eta 0:00:00
Downloading werkzeug-3.0.1-py3-none-any.whl (226 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 226.7/226.7 kB 50.5 MB/s eta 0:00:00
Downloading Flask_Cors-4.0.0-py2.py3-none-any.whl (14 kB)
Downloading Flask_Limiter-3.5.0-py3-none-any.whl (28 kB)
Downloading flask_wtf-1.2.1-py3-none-any.whl (12 kB)
Downloading flask_talisman-1.1.0-py2.py3-none-any.whl (18 kB)
Downloading bcrypt-4.1.2-cp39-abi3-manylinux_2_28_x86_64.whl (698 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 698.9/698.9 kB 57.6 MB/s eta 0:00:00
Downloading python_dotenv-1.0.0-py3-none-any.whl (19 kB)
Downloading python_dateutil-2.8.2-py2.py3-none-any.whl (247 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 247.7/247.7 kB 425.7 MB/s eta 0:00:00
Downloading openpyxl-3.1.2-py2.py3-none-any.whl (249 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 250.0/250.0 kB 212.8 MB/s eta 0:00:00
Downloading python_magic-0.4.27-py2.py3-none-any.whl (13 kB)
Downloading pytest-7.4.3-py3-none-any.whl (325 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 325.1/325.1 kB 74.2 MB/s eta 0:00:00
Downloading pytest_flask-1.3.0-py3-none-any.whl (13 kB)
Downloading coverage-7.3.2-cp311-cp311-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_17_x86_64.manylinux2014_x86_64.whl (231 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 231.4/231.4 kB 160.8 MB/s eta 0:00:00
Downloading gunicorn-21.2.0-py3-none-any.whl (80 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 80.2/80.2 kB 240.4 MB/s eta 0:00:00
Downloading blinker-1.9.0-py3-none-any.whl (8.5 kB)
Downloading click-8.2.1-py3-none-any.whl (102 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 102.2/102.2 kB 288.0 MB/s eta 0:00:00
Downloading itsdangerous-2.2.0-py3-none-any.whl (16 kB)
Downloading jinja2-3.1.6-py3-none-any.whl (134 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 134.9/134.9 kB 304.5 MB/s eta 0:00:00
Downloading limits-5.5.0-py3-none-any.whl (60 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60.9/60.9 kB 300.5 MB/s eta 0:00:00
Downloading MarkupSafe-3.0.2-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (23 kB)
Downloading ordered_set-4.1.0-py3-none-any.whl (7.6 kB)
Downloading packaging-25.0-py3-none-any.whl (66 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 66.5/66.5 kB 265.5 MB/s eta 0:00:00
Downloading pluggy-1.6.0-py3-none-any.whl (20 kB)
Downloading rich-13.9.4-py3-none-any.whl (242 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 242.4/242.4 kB 200.2 MB/s eta 0:00:00
Downloading six-1.17.0-py2.py3-none-any.whl (11 kB)
Downloading typing_extensions-4.15.0-py3-none-any.whl (44 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 44.6/44.6 kB 208.0 MB/s eta 0:00:00
Downloading et_xmlfile-2.0.0-py3-none-any.whl (18 kB)
Downloading iniconfig-2.1.0-py3-none-any.whl (6.0 kB)
Downloading wtforms-3.2.1-py3-none-any.whl (152 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 152.5/152.5 kB 398.1 MB/s eta 0:00:00
Downloading Deprecated-1.2.18-py2.py3-none-any.whl (10.0 kB)
Downloading markdown_it_py-4.0.0-py3-none-any.whl (87 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 87.3/87.3 kB 365.4 MB/s eta 0:00:00
Downloading pygments-2.19.2-py3-none-any.whl (1.2 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.2/1.2 MB 101.1 MB/s eta 0:00:00
Downloading mdurl-0.1.2-py3-none-any.whl (10.0 kB)
Downloading wrapt-1.17.3-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl (82 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 82.4/82.4 kB 347.4 MB/s eta 0:00:00
Installing collected packages: Flask-Talisman, wrapt, typing-extensions, six, python-magic, python-dotenv, pygments, pluggy, packaging, ordered-set, mdurl, MarkupSafe, itsdangerous, iniconfig, et-xmlfile, coverage, click, blinker, bcrypt, wtforms, Werkzeug, python-dateutil, pytest, openpyxl, markdown-it-py, Jinja2, gunicorn, deprecated, rich, limits, Flask, pytest-flask, Flask-WTF, Flask-Limiter, Flask-CORS
Successfully installed Flask-3.0.0 Flask-CORS-4.0.0 Flask-Limiter-3.5.0 Flask-Talisman-1.1.0 Flask-WTF-1.2.1 Jinja2-3.1.6 MarkupSafe-3.0.2 Werkzeug-3.0.1 bcrypt-4.1.2 blinker-1.9.0 click-8.2.1 coverage-7.3.2 deprecated-1.2.18 et-xmlfile-2.0.0 gunicorn-21.2.0 iniconfig-2.1.0 itsdangerous-2.2.0 limits-5.5.0 markdown-it-py-4.0.0 mdurl-0.1.2 openpyxl-3.1.2 ordered-set-4.1.0 packaging-25.0 pluggy-1.6.0 pygments-2.19.2 pytest-7.4.3 pytest-flask-1.3.0 python-dateutil-2.8.2 python-dotenv-1.0.0 python-magic-0.4.27 rich-13.9.4 six-1.17.0 typing-extensions-4.15.0 wrapt-1.17.3 wtforms-3.2.1
WARNING: Running pip as the 'root' user can result in broken permissions and conflicting behaviour with the system package manager. It is recommended to use a virtual environment instead: https://pip.pypa.io/warnings/venv

[notice] A new release of pip is available: 24.0 -> 25.2
[notice] To update, run: pip install --upgrade pip
 ---> Removed intermediate container 191a93c5cba5
 ---> b77088dd86f4
Step 6/13 : COPY . .
 ---> b93d3154ffa5
Step 7/13 : RUN mkdir -p uploads logs data backups secure_uploads exports
 ---> Running in a847b539a5c7
 ---> Removed intermediate container a847b539a5c7
 ---> 4524dbf0bf1c
Step 8/13 : RUN chmod 755 uploads logs data backups secure_uploads exports
 ---> Running in b43a2f64ee4f
 ---> Removed intermediate container b43a2f64ee4f
 ---> 6f363514b029
Step 9/13 : EXPOSE 1111
 ---> Running in cbe60fa78b70
 ---> Removed intermediate container cbe60fa78b70
 ---> 7ccc28184eb9
Step 10/13 : ENV FLASK_ENV=production
 ---> Running in 524ec427c38e
 ---> Removed intermediate container 524ec427c38e
 ---> 728bb74b243b
Step 11/13 : ENV FLASK_HOST=0.0.0.0
 ---> Running in 2b643ad79086
 ---> Removed intermediate container 2b643ad79086
 ---> 55815d734acd
Step 12/13 : ENV FLASK_PORT=1111
 ---> Running in 5afb6cd4cb35
 ---> Removed intermediate container 5afb6cd4cb35
 ---> a7a0f50cfc9e
Step 13/13 : CMD ["python", "app.py"]
 ---> Running in 2e7b54f7ee7d
 ---> Removed intermediate container 2e7b54f7ee7d
 ---> 60425cc65503
Successfully built 60425cc65503
Successfully tagged emmar-delivery:latest
Creating EMMAR-DELIVERY ... done
root@srv889400:/opt/EMMAR-DELIVERY# docker ps
CONTAINER ID   IMAGE                           COMMAND                  CREATED             STATUS                     PORTS                                         NAMES
937dc960170d   emmar-delivery                  "python app.py"          3 minutes ago       Up 3 minutes (unhealthy)   0.0.0.0:1111->1111/tcp, :::1111->1111/tcp     EMMAR-DELIVERY
875a1003751f   creerflow:latest                "docker-entrypoint.s…"   About an hour ago   Up About an hour           0.0.0.0:4000->3000/tcp, [::]:4000->3000/tcp   creerflow-container
aa84c07c8bb1   n8nio/n8n:latest                "tini -- /docker-ent…"   18 hours ago        Up 18 hours (healthy)      0.0.0.0:5678->5678/tcp, :::5678->5678/tcp     n8n
3139e25420d3   hospital_hospital-app           "python -m flask --a…"   3 weeks ago         Up 47 hours (healthy)      0.0.0.0:5001->5001/tcp, :::5001->5001/tcp     alorfmed
5d44b99e5252   alorfmedz_alorfmedz-app         "python -c 'from app…"   5 weeks ago         Up 47 hours (healthy)      0.0.0.0:5000->5000/tcp, :::5000->5000/tcp     alorfmedz-app
d0d8c183a7e0   filebrowser/filebrowser:v2-s6   "/init"                  5 weeks ago         Up 47 hours (healthy)      0.0.0.0:8090->80/tcp, [::]:8090->80/tcp       filebrowser
458629af923f   sarafly_sarafly-app             "/docker-entrypoint.…"   5 weeks ago         Up 47 hours (healthy)      0.0.0.0:3000->80/tcp, [::]:3000->80/tcp       sarafly-system
d35604940c73   abusoliman_abusoliman-pos       "/docker-entrypoint.…"   5 weeks ago         Up 47 hours (healthy)      0.0.0.0:8080->80/tcp, [::]:8080->80/tcp       abusoliman-pos-system
root@srv889400:/opt/EMMAR-DELIVERY# docker logs EMMAR-DELIVERY
Starting Emar Delivery App...
Server running at: http://localhost:1111
[OK] Production mode: Debug disabled
 * Serving Flask app 'app'
 * Debug mode: off
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:1111
 * Running on http://172.26.0.2:1111
Press CTRL+C to quit
root@srv889400:/opt/EMMAR-DELIVERY# curl -I http://localhost:1111
HTTP/1.1 200 OK
Server: Werkzeug/3.0.1 Python/3.11.13
Date: Mon, 08 Sep 2025 00:20:50 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 12307
Feature-Policy: geolocation 'none'; camera 'none'; microphone 'none'
Permissions-Policy: browsing-topics=()
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob:; connect-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1757290911
Retry-After: 60
Access-Control-Allow-Origin: *
Vary: Cookie
Set-Cookie: emar_session=eyJjc3JmX3Rva2VuIjoiMWI4ZDVlN2RlMWUxZTI2MjA3MDg3ZjBmMDU0OGU5NzM1ZDNmODUzMSJ9.aL4hYg.Br3HJf3vJFgQq_1dM_pCYT6UwaI; Secure; HttpOnly; Path=/; SameSite=Lax
Connection: close

root@srv889400:/opt/EMMAR-DELIVERY# nano /etc/nginx/sites-available/emmardelivery.com
root@srv889400:/opt/EMMAR-DELIVERY# ln -s /etc/nginx/sites-available/emmardelivery.com /etc/nginx/sites-enabled/
root@srv889400:/opt/EMMAR-DELIVERY# nginx -t
2025/09/08 00:22:31 [emerg] 1324832#1324832: "limit_req_zone" directive is not allowed here in /etc/nginx/sites-enabled/emmardelivery.com:12
nginx: configuration file /etc/nginx/nginx.conf test failed
root@srv889400:/opt/EMMAR-DELIVERY# nano /etc/nginx/sites-available/emmardelivery.com
root@srv889400:/opt/EMMAR-DELIVERY# nginx -t
2025/09/08 00:23:49 [warn] 1325460#1325460: "ssl_stapling" ignored, no OCSP responder URL in the certificate "/etc/letsencrypt/live/careerflowkw.com/fullchain.pem"
2025/09/08 00:23:49 [warn] 1325460#1325460: "ssl_stapling" ignored, no OCSP responder URL in the certificate "/etc/letsencrypt/live/n8n-waleed.shop/fullchain.pem"
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
root@srv889400:/opt/EMMAR-DELIVERY# systemctl reload nginx
root@srv889400:/opt/EMMAR-DELIVERY# certbot --nginx -d emmardelivery.com -d www.emmardelivery.com
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Requesting a certificate for emmardelivery.com and www.emmardelivery.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/emmardelivery.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/emmardelivery.com/privkey.pem
This certificate expires on 2025-12-06.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

Deploying certificate
Successfully deployed certificate for emmardelivery.com to /etc/nginx/sites-enabled/emmardelivery.com
Successfully deployed certificate for www.emmardelivery.com to /etc/nginx/sites-enabled/emmardelivery.com
Congratulations! You have successfully enabled HTTPS on https://emmardelivery.com and https://www.emmardelivery.com

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
root@srv889400:/opt/EMMAR-DELIVERY# curl -I https://emmardelivery.com
HTTP/2 200 
server: nginx/1.24.0 (Ubuntu)
date: Mon, 08 Sep 2025 00:25:08 GMT
content-type: text/html; charset=utf-8
content-length: 12307
feature-policy: geolocation 'none'; camera 'none'; microphone 'none'
permissions-policy: browsing-topics=()
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob:; connect-src 'self'
strict-transport-security: max-age=31536000; includeSubDomains
referrer-policy: strict-origin-when-cross-origin
x-ratelimit-limit: 300
x-ratelimit-remaining: 298
x-ratelimit-reset: 1757291154
retry-after: 45
access-control-allow-origin: *
vary: Cookie
set-cookie: emar_session=eyJjc3JmX3Rva2VuIjoiZGZkNDBiODQ2MGIzMDdkYzQxYjI2NDM1NDI5MTJkNjM5MzcwZDZjZiJ9.aL4iZA.jh_18HHe0pNrKJpc3t2VTxUAChs; Secure; HttpOnly; Path=/; SameSite=Lax
x-frame-options: SAMEORIGIN
x-xss-protection: 1; mode=block
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin

root@srv889400:/opt/EMMAR-DELIVERY# 