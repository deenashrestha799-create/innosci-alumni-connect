import os

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
client = boto3.client("cognito-idp", region_name=os.getenv("COGNITO_REGION"))


class CognitoError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def create_disabled_user(email: str, password: str) -> str:
    created = False
    try:
        response = client.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=email,
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "email_verified", "Value": "true"},
            ],
            MessageAction="SUPPRESS",
        )
        created = True
        sub = next(a["Value"] for a in response["User"]["Attributes"] if a["Name"] == "sub")
        client.admin_set_user_password(
            UserPoolId=USER_POOL_ID, Username=email, Password=password, Permanent=True
        )
        client.admin_disable_user(UserPoolId=USER_POOL_ID, Username=email)
        return sub
    except ClientError as error:
        if created:
            delete_user(email)
        code = error.response["Error"]["Code"]
        if code == "UsernameExistsException":
            raise CognitoError(409, "Email already registered")
        if code == "InvalidPasswordException":
            raise CognitoError(400, error.response["Error"]["Message"])
        print(f"Cognito error while creating user: {code}")
        raise CognitoError(500, "Could not create the login account. Please try again.")


def enable_user(email: str) -> None:
    try:
        client.admin_enable_user(UserPoolId=USER_POOL_ID, Username=email)
    except ClientError as error:
        print(f"Cognito error while enabling user: {error.response['Error']['Code']}")
        raise CognitoError(502, "Could not enable the login account.")


def delete_user(email: str) -> None:
    try:
        client.admin_delete_user(UserPoolId=USER_POOL_ID, Username=email)
    except ClientError:
        pass

def add_user_to_group(email: str, group_name: str) -> None:
    try:
        client.admin_add_user_to_group(
            UserPoolId=USER_POOL_ID,
            Username=email,
            GroupName=group_name,
        )
    except ClientError as error:
        print(f"Could not add user to group: {error}")
        raise CognitoError(500, "Could not assign user role.")

def add_to_group(email, group="ADMIN"):
    try:
        boto3.client("cognito-idp", region_name=COGNITO_REGION).admin_add_user_to_group(
            UserPoolId=USER_POOL_ID,
            Username=email,
            GroupName=group,
        )
    except ClientError:
        raise CognitoError(500, "Could not assign the admin group.")