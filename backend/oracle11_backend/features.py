from django.db.backends.oracle.features import DatabaseFeatures as OracleDatabaseFeatures


class DatabaseFeatures(OracleDatabaseFeatures):
    minimum_database_version = (11, 2)
    supports_comments = False

