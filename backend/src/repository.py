import pymysql

import db_utils

import json

def get_all_users(
    search=None,
    company=None,
    graduation_year=None,
    program=None,
    skill=None
):

    print("Repository: Fetching filtered users")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        sql = """
        SELECT *
        FROM users
        WHERE status = 'APPROVED'
        """

        params = []

        if search:
            sql += """
            AND (
                full_name LIKE %s
                OR email LIKE %s
            )
            """
            params.extend([
                f"%{search}%",
                f"%{search}%"
            ])

        if company:
            sql += """
            AND company LIKE %s
            """
            params.append(f"%{company}%")

        if graduation_year:
            sql += """
            AND graduation_year = %s
            """
            params.append(graduation_year)

        if program:
            sql += """
            AND program LIKE %s
            """
            params.append(f"%{program}%")

        if skill:
            sql += """
            AND skills LIKE %s
            """
            params.append(f"%{skill}%")

        cursor.execute(
            sql,
            params
        )

        return cursor.fetchall()

    finally:
        connection.close()
        print("Repository: Connection closed")

def create_user(user_data):

    print("Repository: Creating user")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        sql = """
        INSERT INTO users
        (
            user_id,
            cognito_sub,
            email,
            full_name,
            phone,
            location,
            graduation_year,
            program,
            job_title,
            company,
            linkedin_url,
            skills,
            interests,
            bio,
            role,
            status,
            consent_at
        )
        VALUES
        (
            %(user_id)s,
            %(cognito_sub)s,
            %(email)s,
            %(full_name)s,
            %(phone)s,
            %(location)s,
            %(graduation_year)s,
            %(program)s,
            %(job_title)s,
            %(company)s,
            %(linkedin_url)s,
            %(skills)s,
            %(interests)s,
            %(bio)s,
            %(role)s,
            %(status)s,
            CURRENT_TIMESTAMP
        )
        """

        try:
            cursor.execute(sql, user_data)

            connection.commit()

            print("Repository: User inserted")

        except pymysql.IntegrityError:

            print("Repository: Duplicate email")

            raise

    finally:
        connection.close()
        print("Repository: Connection closed")


def approve_user(user_id):

    print("Repository: Approving user")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        sql = """
        UPDATE users
        SET status = 'APPROVED'
        WHERE user_id = %(user_id)s
        """

        cursor.execute(
            sql,
            {
                "user_id": user_id
            }
        )

        connection.commit()

        rows_updated = cursor.rowcount

        print("Repository: User approved")

        return rows_updated

    finally:
        connection.close()
        print("Repository: Connection closed")

def get_user_by_cognito_sub(cognito_sub):

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM users
            WHERE cognito_sub = %(cognito_sub)s
            """,
            {
                "cognito_sub": cognito_sub
            }
        )

        return cursor.fetchone()

    finally:
        connection.close()

def update_user(cognito_sub, user_data):

    print("Repository: Updating user")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        fields = []
        values = {}

        for key, value in user_data.items():
            if value is not None:
                fields.append(f"{key} = %({key})s")
                values[key] = value

        if not fields:
            return

        values["cognito_sub"] = cognito_sub

        sql = f"""
        UPDATE users
        SET {", ".join(fields)}
        WHERE cognito_sub = %(cognito_sub)s
        """

        cursor.execute(sql, values)

        connection.commit()

    finally:
        connection.close()

def get_user_by_id(user_id):

    print("Repository: Fetching user by id")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM users
            WHERE user_id = %s
            AND status = 'APPROVED'
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        return user

    finally:
        connection.close()
        print("Repository: Connection closed")

def get_pending_users():

    print("Repository: Fetching pending users")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT *
            FROM users
            WHERE status = 'PENDING'
        """)

        return cursor.fetchall()

    finally:
        connection.close()
        print("Repository: Connection closed")

def reject_user(user_id):

    print("Repository: Rejecting user")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        sql = """
        UPDATE users
        SET status = 'REJECTED'
        WHERE user_id = %(user_id)s
        """

        cursor.execute(
            sql,
            {
                "user_id": user_id
            }
        )

        connection.commit()

        return cursor.rowcount

    finally:
        connection.close()
        print("Repository: Connection closed")

def get_admin_stats():

    print("Repository: Getting admin stats")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                COUNT(*) AS total_users,
                SUM(status='APPROVED') AS approved_users,
                SUM(status='PENDING') AS pending_users,
                SUM(status='REJECTED') AS rejected_users,
                SUM(role='ADMIN') AS admins
            FROM users
        """)

        return cursor.fetchone()

    finally:
        connection.close()
        print("Repository: Connection closed")

def get_spotlights():

    print("Repository: Fetching spotlight stories")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                slide_id,
                title,
                alumni_name,
                summary,
                image_url,
                podcast_url
            FROM spotlight
            ORDER BY sort_order
            LIMIT 5
        """)

        return cursor.fetchall()

    finally:
        connection.close()
        print("Repository: Connection closed")


def create_spotlight(spotlight_data):

    print("Repository: Creating spotlight")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        sql = """
        INSERT INTO spotlight
        (
            title,
            alumni_name,
            summary,
            image_url,
            podcast_url,
            sort_order
        )
        VALUES
        (
            %(title)s,
            %(alumni_name)s,
            %(summary)s,
            %(image_url)s,
            %(podcast_url)s,
            %(sort_order)s
        )
        """

        cursor.execute(sql, spotlight_data)

        connection.commit()

        return cursor.lastrowid

    finally:
        connection.close()
        print("Repository: Connection closed")


def update_spotlight(slide_id, spotlight_data):

    print("Repository: Updating spotlight")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        sql = """
        UPDATE spotlight
        SET
            title = %(title)s,
            alumni_name = %(alumni_name)s,
            summary = %(summary)s,
            image_url = %(image_url)s,
            podcast_url = %(podcast_url)s,
            sort_order = %(sort_order)s
        WHERE slide_id = %(slide_id)s
        """

        spotlight_data["slide_id"] = slide_id

        cursor.execute(sql, spotlight_data)

        connection.commit()

        return cursor.rowcount

    finally:
        connection.close()
        print("Repository: Connection closed")


def delete_spotlight(slide_id):

    print("Repository: Deleting spotlight")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM spotlight
            WHERE slide_id = %(slide_id)s
            """,
            {
                "slide_id": slide_id
            }
        )

        connection.commit()

        return cursor.rowcount

    finally:
        connection.close()
        print("Repository: Connection closed")
        
def set_cognito_sub(user_id, cognito_sub):
    connection = db_utils.get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE users SET cognito_sub = %(cognito_sub)s WHERE user_id = %(user_id)s",
            {"cognito_sub": cognito_sub, "user_id": user_id},
        )
        connection.commit()
    finally:
        connection.close()


def delete_user(user_id):
    connection = db_utils.get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM users WHERE user_id = %(user_id)s", {"user_id": user_id})
        connection.commit()
    finally:
        connection.close()


def get_user_any_status(user_id):
    connection = db_utils.get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT user_id, email, cognito_sub, status FROM users WHERE user_id = %(user_id)s",
            {"user_id": user_id},
        )
        return cursor.fetchone()
    finally:
        connection.close()


def get_dashboard_candidates(user_id):

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
                SELECT user_id, full_name, job_title, company, location, program,
                graduation_year, skills, interests, profile_picture_url
            FROM users
            WHERE status = 'APPROVED'
              AND user_id <> %(user_id)s
            LIMIT 500
            """,
            {"user_id": user_id},
        )

        return cursor.fetchall()

    finally:
        connection.close()

#13/11/26 - Mentornship services
def save_mentor_profile(user_id, mentor_data):
    print("Repository: Saving mentor profile")

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        sql = """
            INSERT INTO mentor_profiles (
                user_id,
                expertise,
                monthly_availability,
                bio,
                is_active
            )
            VALUES (
                %(user_id)s,
                %(expertise)s,
                %(monthly_availability)s,
                %(bio)s,
                TRUE
            )
            ON DUPLICATE KEY UPDATE
                expertise = VALUES(expertise),
                monthly_availability = VALUES(monthly_availability),
                bio = VALUES(bio),
                is_active = TRUE
        """

        data = {
            "user_id": user_id,
            "expertise": json.dumps(mentor_data["expertise"]),
            "monthly_availability": mentor_data["monthly_availability"],
            "bio": mentor_data.get("bio"),
        }

        cursor.execute(sql, data)
        connection.commit()

    finally:
        connection.close()

#Retreive available mentor profiles
def get_available_mentors(exclude_user_id):
    connection = db_utils.get_db_connection()

    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(
                """
                SELECT
                    mp.mentor_id,
                    mp.user_id,
                    mp.expertise,
                    mp.monthly_availability,
                    mp.bio,
                    mp.is_active,
                    u.full_name,
                    u.job_title,
                    u.company,
                    u.location,
                    u.program,
                    u.graduation_year,
                    u.profile_picture_url
                FROM mentor_profiles mp
                JOIN users u
                    ON mp.user_id = u.user_id
                WHERE
                    mp.is_active = TRUE
                    AND u.status = 'APPROVED'
                    AND mp.user_id != %s
                """,
                (exclude_user_id,)
            )

            return cursor.fetchall()

    finally:
        connection.close()

#deactivate mentor profile
def deactivate_mentor_profile(user_id):
    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE mentor_profiles
            SET is_active = FALSE
            WHERE user_id = %s
            """,
            (user_id,)
        )

        connection.commit()

        return cursor.rowcount

    finally:
        connection.close()
def get_directory_profile(user_id):

    connection = db_utils.get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT user_id, full_name, job_title, company, location, program,
                   graduation_year, skills, interests, bio, linkedin_url,
                   profile_picture_url
            FROM users
            WHERE user_id = %(user_id)s
              AND status = 'APPROVED'
            """,
            {"user_id": user_id},
        )

        return cursor.fetchone()

    finally:
        connection.close()

def get_user_by_cognito_sub(cognito_sub):
    connection = db_utils.get_db_connection()

    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT
                    user_id,
                    cognito_sub,
                    email,
                    full_name,
                    role,
                    status,
                    graduation_year,
                    program,
                    skills,
                    interests,
                    bio,
                    phone,
                    location,
                    job_title,
                    company,
                    linkedin_url,
                    profile_picture_url
                FROM users
                WHERE cognito_sub = %s
            """, (cognito_sub,))

            return cursor.fetchone()

    finally:
        connection.close()    
def get_mentor_by_user_id(user_id):
    connection = db_utils.get_db_connection()

    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(
                """
                SELECT
                    mp.mentor_id,
                    mp.user_id,
                    mp.expertise,
                    mp.monthly_availability,
                    mp.bio,
                    mp.is_active,
                    u.full_name,
                    u.job_title,
                    u.company,
                    u.location,
                    u.program,
                    u.graduation_year,
                    u.profile_picture_url
                FROM mentor_profiles mp
                JOIN users u
                    ON mp.user_id = u.user_id
                WHERE mp.user_id = %s
                """,
                (user_id,)
            )

            return cursor.fetchone()

    finally:
        connection.close()

def get_admin_users():
    connection = db_utils.get_db_connection()

    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT
                    user_id,
                    full_name,
                    email,
                    phone,
                    location,
                    graduation_year,
                    program,
                    job_title,
                    company,
                    linkedin_url,
                    skills,
                    interests,
                    bio,
                    role,
                    status,
                    consent_at
                FROM users
                ORDER BY consent_at DESC
            """)

            return cursor.fetchall()

    finally:
        connection.close()

def get_active_mentor_count():
    connection = db_utils.get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) AS total
                FROM mentor_profiles mp
                JOIN users u ON u.user_id = mp.user_id
                WHERE mp.is_active = TRUE
                  AND u.status = 'APPROVED'
            """)

            return cursor.fetchone()["total"]

    finally:
        connection.close()

def get_registration_stats():
    connection = db_utils.get_db_connection()

    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT
                    DATE(consent_at) AS registration_date,
                    COUNT(*) AS total
                FROM users
                WHERE consent_at >= DATE_SUB(
                    CURDATE(), INTERVAL 30 DAY
                )
                GROUP BY DATE(consent_at)
                ORDER BY registration_date
            """)

            return cursor.fetchall()

    finally:
        connection.close()

def get_active_mentors():
    connection = db_utils.get_db_connection()

    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT
                    mp.mentor_id,
                    mp.user_id,
                    mp.expertise,
                    mp.monthly_availability,
                    mp.bio,
                    mp.created_at,
                    u.full_name,
                    u.email,
                    u.job_title,
                    u.company,
                    u.location,
                    u.program,
                    u.profile_picture_url
                FROM mentor_profiles mp
                INNER JOIN users u
                    ON mp.user_id = u.user_id
                WHERE mp.is_active = TRUE
                  AND u.status = 'APPROVED'
                ORDER BY mp.created_at DESC
            """)

            return cursor.fetchall()

    finally:
        connection.close()

def get_home_data():
    connection = db_utils.get_db_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT COUNT(*) AS alumni,
                   COUNT(DISTINCT NULLIF(TRIM(program), '')) AS programmes
            FROM users
            WHERE status = 'APPROVED' AND role <> 'ADMIN'
        """)
        counts = cursor.fetchone()

        cursor.execute("""
            SELECT location FROM users
            WHERE status = 'APPROVED' AND role <> 'ADMIN' AND location IS NOT NULL
        """)
        locations = [row["location"] for row in cursor.fetchall()]

        cursor.execute("""
            SELECT user_id, full_name, job_title, company, program,
                   graduation_year, location, bio, profile_picture_url
            FROM users
            WHERE status = 'APPROVED' AND role <> 'ADMIN'
            ORDER BY (bio IS NULL OR bio = ''), consent_at DESC
            LIMIT 5
        """)
        spotlight = cursor.fetchall()

        cursor.execute("""
            SELECT full_name FROM users
            WHERE status = 'APPROVED' AND role <> 'ADMIN'
            ORDER BY consent_at DESC LIMIT 1
        """)
        latest = cursor.fetchone()

        return counts, locations, spotlight, latest
    finally:
        connection.close()

def create_announcement(data):
    connection = db_utils.get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO announcements
                (title, message, created_by, expires_at, is_active)
                VALUES (%s, %s, %s, %s, TRUE)
            """, (data["title"], data["message"], data["created_by"], data["expires_at"]))
            connection.commit()
            return cursor.lastrowid
    finally:
        connection.close()


def update_announcement(announcement_id, data):
    connection = db_utils.get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE announcements
                SET title = %s, message = %s, expires_at = %s
                WHERE announcement_id = %s
                """,
                (data["title"], data["message"], data["expires_at"], announcement_id),
            )
            connection.commit()
            return cursor.rowcount
    finally:
        connection.close()


def get_announcements():
    """Public list: still active, not expired, newest 5."""
    connection = db_utils.get_db_connection()
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT *
                FROM announcements
                WHERE is_active = TRUE
                    AND (expires_at IS NULL OR expires_at >= CURDATE())
                ORDER BY created_at DESC
                LIMIT 5
            """)
            return cursor.fetchall()
    finally:
        connection.close()


def get_all_announcements():
    """Admin list: every row, including inactive and expired."""
    connection = db_utils.get_db_connection()
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT * FROM announcements
                ORDER BY created_at DESC
            """)
            return cursor.fetchall()
    finally:
        connection.close()

def delete_announcement(announcement_id):
    connection = db_utils.get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM announcements WHERE announcement_id = %s",
                (announcement_id,),
            )
            connection.commit()
            return cursor.rowcount
    finally:
        connection.close()
# ALTER TABLE users
# ADD COLUMN cognito_sub VARCHAR(255) NULL UNIQUE;
