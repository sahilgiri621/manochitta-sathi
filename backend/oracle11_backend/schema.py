from django.db import DatabaseError
from django.db.backends.oracle.schema import DatabaseSchemaEditor as OracleDatabaseSchemaEditor


class DatabaseSchemaEditor(OracleDatabaseSchemaEditor):
    def add_index(self, model, index):
        try:
            return super().add_index(model, index)
        except DatabaseError as exc:
            if "ORA-01408" not in str(exc):
                raise

    def _is_identity_column(self, table_name, column_name):
        return False

    def _drop_identity(self, table_name, column_name):
        return None

    def _get_default_collation(self, table_name):
        return None
