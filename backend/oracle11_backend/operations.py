from django.db.backends.oracle.operations import DatabaseOperations as OracleDatabaseOperations
from django.db.backends.utils import strip_quotes, truncate_name


class DatabaseOperations(OracleDatabaseOperations):
    compiler_module = "oracle11_backend.compiler"

    def autoinc_sql(self, table, column):
        table_name = strip_quotes(table)
        sequence_name = self._get_no_autofield_sequence_name(table_name)
        trigger_name = truncate_name(f"{table_name}_TR", self.max_name_length()).upper()
        qn_table = self.quote_name(table_name)
        qn_column = self.quote_name(column)
        qn_sequence = self.quote_name(sequence_name)
        qn_trigger = self.quote_name(trigger_name)
        return [
            f"CREATE SEQUENCE {qn_sequence}",
            (
                f"CREATE OR REPLACE TRIGGER {qn_trigger} "
                f"BEFORE INSERT ON {qn_table} "
                f"FOR EACH ROW "
                f"WHEN (new.{qn_column} IS NULL) "
                f"BEGIN SELECT {qn_sequence}.NEXTVAL INTO :new.{qn_column} FROM DUAL; END;/"
            ),
        ]

    def _get_sequence_name(self, cursor, table, pk_name):
        return self._get_no_autofield_sequence_name(table)
