from django.db.models.sql.compiler import (
    SQLAggregateCompiler,
    SQLCompiler as BaseSQLCompiler,
    SQLDeleteCompiler,
    SQLInsertCompiler,
    SQLUpdateCompiler,
)


class SQLCompiler(BaseSQLCompiler):
    def as_sql(self, with_limits=True, with_col_aliases=False):
        if (
            with_limits
            and self.query.is_sliced
            and getattr(self.connection, "oracle_version", (0,)) < (12,)
        ):
            sql, params = super().as_sql(
                with_limits=False,
                with_col_aliases=with_col_aliases,
            )
            high_mark = self.query.high_mark
            low_mark = self.query.low_mark
            inner = f'SELECT "_SUB".*, ROWNUM AS "_RN" FROM ({sql}) "_SUB"'
            if high_mark is not None:
                inner += f" WHERE ROWNUM <= {high_mark}"
            if low_mark:
                return f'SELECT * FROM ({inner}) WHERE "_RN" > {low_mark}', params
            return inner, params
        return super().as_sql(
            with_limits=with_limits,
            with_col_aliases=with_col_aliases,
        )


class SQLInsertCompiler(SQLInsertCompiler):
    pass


class SQLDeleteCompiler(SQLDeleteCompiler):
    pass


class SQLUpdateCompiler(SQLUpdateCompiler):
    pass


class SQLAggregateCompiler(SQLAggregateCompiler):
    pass
