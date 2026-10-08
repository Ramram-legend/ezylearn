/**
 * Faux client Supabase en memoire pour les tests (lib/credits, routes API).
 * Supporte les chaines utilisees par le code applicatif :
 *   select()/eq()/gte()/order()/limit()/maybeSingle()/single()/insert()/update()
 *   et les RPC monetisation : increment_daily_usage, decrement_bonus_credit,
 *   increment_bonus_credit.
 */

type Row = Record<string, unknown>;

export interface FakeDbResult {
  data: unknown;
  error: { message: string } | null;
  count?: number;
}

let idCounter = 0;

export class FakeQuery {
  private store: FakeStore;
  private tableName: string;
  private rows: Row[];
  private filters: Array<(r: Row) => boolean> = [];
  private countRequested = false;

  constructor(store: FakeStore, tableName: string) {
    this.store = store;
    this.tableName = tableName;
    this.rows = store.tables[tableName] ?? [];
  }

  eq(col: string, value: unknown): this {
    this.filters.push((r) => r[col] === value);
    return this;
  }

  gte(col: string, value: unknown): this {
    this.filters.push((r) => (r[col] as string | number | Date) >= (value as string | number | Date));
    return this;
  }

  select(_fields?: string | string[] | object, opts?: { count?: string }): this {
    if (opts?.count === 'exact') this.countRequested = true;
    return this;
  }

  order(_col: string, _opts?: unknown): this {
    return this;
  }

  limit(_n: number): this {
    return this;
  }

  insert(rows: Row | Row[]): this {
    const toInsert = Array.isArray(rows) ? rows : [rows];
    this.store.tables[this.tableName] ??= [];
    const inserted: Row[] = [];
    for (const row of toInsert) {
      const record: Row = { ...row };
      if (!record.id) record.id = `mock-${++idCounter}`;
      this.store.tables[this.tableName].push(record);
      inserted.push(record);
    }
    this.rows = inserted;
    return this;
  }

  update(partial: Row): this {
    for (const row of this.matched()) Object.assign(row, partial);
    return this;
  }

  upsert(rows: Row | Row[], opts?: { onConflict?: string }): this {
    const list = Array.isArray(rows) ? rows : [rows];
    const key = opts?.onConflict ?? 'id';
    this.store.tables[this.tableName] ??= [];
    for (const row of list) {
      const existing = this.store.tables[this.tableName].find((r) => r[key] === row[key]);
      if (existing) Object.assign(existing, row);
      else this.store.tables[this.tableName].push({ ...row });
    }
    return this;
  }

  private matched(): Row[] {
    return this.rows.filter((r) => this.filters.every((f) => f(r)));
  }

  async maybeSingle(): Promise<FakeDbResult> {
    const rows = this.matched();
    return { data: rows[0] ?? null, error: null };
  }

  async single(): Promise<FakeDbResult> {
    const rows = this.matched();
    return rows.length > 0
      ? { data: rows[0], error: null }
      : { data: null, error: { message: 'No rows' } };
  }

  then<T>(resolve: (value: FakeDbResult) => T, reject?: (reason?: unknown) => T): Promise<T> {
    const rows = this.matched();
    const result: FakeDbResult = { data: null, error: null };
    if (this.countRequested) {
      result.data = rows;
      result.count = rows.length;
    } else {
      result.data = rows;
    }
    return Promise.resolve(result).then(resolve, reject);
  }
}

export class FakeStore {
  tables: Record<string, Row[]> = {};

  constructor(initial: Record<string, Row[]> = {}) {
    for (const [name, rows] of Object.entries(initial)) {
      this.tables[name] = rows.map((r) => ({ ...r }));
    }
  }

  from(table: string): FakeQuery {
    return new FakeQuery(this, table);
  }

  async rpc(name: string, args: Record<string, unknown>): Promise<FakeDbResult> {
    const userId = String(args.user_id_param);

    if (name === 'increment_daily_usage') {
      const today = new Date().toISOString().split('T')[0];
      this.tables.user_daily_usage ??= [];
      const row = this.tables.user_daily_usage.find(
        (r) => r.user_id === userId && r.usage_date === today
      );
      if (row) {
        row.lessons_generated = Number(row.lessons_generated) + 1;
        return { data: row.lessons_generated, error: null };
      }
      this.tables.user_daily_usage.push({ user_id: userId, usage_date: today, lessons_generated: 1 });
      return { data: 1, error: null };
    }

    if (name === 'decrement_bonus_credit') {
      const row = this.tables.user_credits?.find((r) => r.user_id === userId);
      if (row && Number(row.balance) > 0) {
        row.balance = Number(row.balance) - 1;
        return { data: true, error: null };
      }
      return { data: false, error: null };
    }

    if (name === 'increment_bonus_credit') {
      this.tables.user_credits ??= [];
      const row = this.tables.user_credits.find((r) => r.user_id === userId);
      const amount = Number(args.amount ?? 1);
      if (row) {
        row.balance = Number(row.balance) + amount;
      } else {
        this.tables.user_credits.push({ user_id: userId, balance: amount });
      }
      return { data: null, error: null };
    }

    return { data: null, error: { message: `RPC inconnue: ${name}` } };
  }
}
