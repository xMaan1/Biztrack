import os
import boto3
from botocore.config import Config
from sqlalchemy import create_engine, text

DST = "60e7ced9-cfc2-43e4-8571-d077376b39cf"
engine = create_engine(os.environ["DATABASE_URL"])
s3 = boto3.client(
    "s3",
    config=Config(s3={"addressing_style": "path"}),
    aws_access_key_id=os.environ["S3_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["S3_SECRET_ACCESS_KEY"],
    endpoint_url=os.environ["S3_ENDPOINT_URL"],
    region_name=os.environ.get("S3_REGION", "eu-north-1"),
)
bucket = os.environ["S3_BUCKET_NAME"]
with engine.connect() as c:
    rows = c.execute(
        text(
            """
            SELECT attachments FROM contacts
            WHERE tenant_id = :dst AND attachments IS NOT NULL
              AND attachments::text NOT IN ('[]', 'null')
            """
        ),
        {"dst": DST},
    ).fetchall()
keys = []
for row in rows:
    for a in row.attachments or []:
        k = a.get("s3_key")
        if k:
            keys.append(k)
for k in keys:
    try:
        s3.head_object(Bucket=bucket, Key=k)
        print("OK", k)
    except Exception as e:
        print("MISSING", k, e)
