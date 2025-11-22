# Repositories

このディレクトリには、データベース操作を行うRepositoryクラスを配置します。

## Repositoryパターンについて

Repositoryパターンは、データアクセスロジックをビジネスロジックから分離するためのデザインパターンです。
データベースへのアクセスを抽象化し、アプリケーションの他の部分から独立させることができます。

## 使用例

```typescript
// src/main/repositories/exampleRepository.ts
import { db } from '@main/database'
import { exampleTable, type NewExample } from '@main/database/schemas'
import { eq } from 'drizzle-orm'

export class ExampleRepository {
  async findAll() {
    return await db.select().from(exampleTable)
  }

  async findById(id: number) {
    const results = await db.select().from(exampleTable).where(eq(exampleTable.id, id))
    return results[0]
  }

  async create(data: NewExample) {
    const results = await db.insert(exampleTable).values(data).returning()
    return results[0]
  }

  async update(id: number, data: Partial<NewExample>) {
    const results = await db
      .update(exampleTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(exampleTable.id, id))
      .returning()
    return results[0]
  }

  async delete(id: number) {
    await db.delete(exampleTable).where(eq(exampleTable.id, id))
  }
}

export const exampleRepository = new ExampleRepository()
```
