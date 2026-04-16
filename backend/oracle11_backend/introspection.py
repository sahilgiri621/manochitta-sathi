from django.db.backends.oracle.introspection import (
    DatabaseIntrospection as OracleDatabaseIntrospection,
    FieldInfo,
)


class DatabaseIntrospection(OracleDatabaseIntrospection):
    def get_table_description(self, cursor, table_name):
        cursor.execute(
            """
            SELECT
                user_tab_cols.column_name,
                user_tab_cols.data_default,
                CASE
                    WHEN user_tab_cols.char_used IS NULL
                    THEN user_tab_cols.data_length
                    ELSE user_tab_cols.char_length
                END as display_size,
                user_col_comments.comments as col_comment
            FROM user_tab_cols
            LEFT OUTER JOIN
                user_col_comments ON
                user_col_comments.column_name = user_tab_cols.column_name AND
                user_col_comments.table_name = user_tab_cols.table_name
            WHERE user_tab_cols.table_name = UPPER(%s)
            """,
            [table_name],
        )
        field_map = {
            column: (
                display_size,
                default.rstrip() if default and default != "NULL" else None,
                None,
                False,
                False,
                comment,
            )
            for (column, default, display_size, comment) in cursor.fetchall()
        }
        self.cache_bust_counter += 1
        cursor.execute(
            "SELECT * FROM {} WHERE ROWNUM < 2 AND {} > 0".format(
                self.connection.ops.quote_name(table_name), self.cache_bust_counter
            )
        )
        description = []
        for desc in cursor.description:
            name = desc[0]
            (
                display_size,
                default,
                collation,
                is_autofield,
                is_json,
                comment,
            ) = field_map[name]
            name %= {}
            description.append(
                FieldInfo(
                    self.identifier_converter(name),
                    desc[1],
                    display_size,
                    desc[3],
                    desc[4] or 0,
                    desc[5] or 0,
                    *desc[6:],
                    default,
                    collation,
                    is_autofield,
                    is_json,
                    comment,
                )
            )
        return description

    def get_sequences(self, cursor, table_name, table_fields=()):
        for f in table_fields:
            if f.primary_key and f.get_internal_type() in ("AutoField", "BigAutoField", "SmallAutoField"):
                return [{"table": table_name, "column": f.column}]
        return []
