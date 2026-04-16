from django.db.backends.oracle.base import DatabaseWrapper as OracleDatabaseWrapper

from .features import DatabaseFeatures
from .introspection import DatabaseIntrospection
from .operations import DatabaseOperations
from .schema import DatabaseSchemaEditor


class DatabaseWrapper(OracleDatabaseWrapper):
    features_class = DatabaseFeatures
    introspection_class = DatabaseIntrospection
    ops_class = DatabaseOperations
    SchemaEditorClass = DatabaseSchemaEditor

    data_types = OracleDatabaseWrapper.data_types.copy()
    data_types.update(
        {
            "AutoField": "NUMBER(11)",
            "BigAutoField": "NUMBER(19)",
            "SmallAutoField": "NUMBER(5)",
        }
    )

    data_type_check_constraints = OracleDatabaseWrapper.data_type_check_constraints.copy()
    data_type_check_constraints.pop("JSONField", None)
