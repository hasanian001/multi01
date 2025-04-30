import { PrismaClient } from '@prisma/client';

/**
 * Extiende el cliente Prisma para asegurarse de que los modelos PaymentTransaction y PaymentRefund
 * estén disponibles para operaciones CRUD.
 */
export function extendPrismaClient(prisma: PrismaClient) {
  return prisma.$extends({
    model: {
      // Aseguramos que PaymentTransaction esté disponible
      paymentTransaction: {
        async findUnique(args) {
          const { where } = args;
          if (where.transactionId) {
            const results = await prisma.$queryRaw`
              SELECT * FROM "PaymentTransaction" WHERE "transactionId" = ${where.transactionId} LIMIT 1
            `;
            return results[0] || null;
          } else if (where.id) {
            const results = await prisma.$queryRaw`
              SELECT * FROM "PaymentTransaction" WHERE "id" = ${where.id} LIMIT 1
            `;
            return results[0] || null;
          }
          return null;
        },
        async findMany(args) {
          const { where, orderBy, skip, take } = args || {};
          let query = `SELECT * FROM "PaymentTransaction"`;
          
          const whereConditions = [];
          const params = [];
          
          // Construir la cláusula WHERE básica
          if (where) {
            if (where.userId) {
              whereConditions.push(`"userId" = $${params.length + 1}`);
              params.push(where.userId);
            }
            if (where.orderId) {
              whereConditions.push(`"orderId" = $${params.length + 1}`);
              params.push(where.orderId);
            }
            if (where.status) {
              whereConditions.push(`"status" = $${params.length + 1}`);
              params.push(where.status);
            }
            if (where.provider) {
              whereConditions.push(`"provider" = $${params.length + 1}`);
              params.push(where.provider);
            }
          }
          
          if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
          }
          
          // Ordenación
          if (orderBy) {
            const orderByClauses = [];
            for (const [field, direction] of Object.entries(orderBy)) {
              orderByClauses.push(`"${field}" ${direction === 'desc' ? 'DESC' : 'ASC'}`);
            }
            if (orderByClauses.length > 0) {
              query += ` ORDER BY ${orderByClauses.join(', ')}`;
            }
          }
          
          // Paginación
          if (skip !== undefined) {
            query += ` OFFSET ${skip}`;
          }
          if (take !== undefined) {
            query += ` LIMIT ${take}`;
          }
          
          return await prisma.$queryRawUnsafe(query, ...params);
        },
        async count(args) {
          const { where } = args || {};
          let query = `SELECT COUNT(*) FROM "PaymentTransaction"`;
          
          const whereConditions = [];
          const params = [];
          
          if (where) {
            if (where.userId) {
              whereConditions.push(`"userId" = $${params.length + 1}`);
              params.push(where.userId);
            }
            if (where.orderId) {
              whereConditions.push(`"orderId" = $${params.length + 1}`);
              params.push(where.orderId);
            }
            if (where.status) {
              whereConditions.push(`"status" = $${params.length + 1}`);
              params.push(where.status);
            }
            if (where.provider) {
              whereConditions.push(`"provider" = $${params.length + 1}`);
              params.push(where.provider);
            }
          }
          
          if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
          }
          
          const result = await prisma.$queryRawUnsafe(query, ...params);
          return Number(result[0].count);
        },
        async create(args) {
          const { data } = args;
          const columns = Object.keys(data).map(k => `"${k}"`).join(', ');
          const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
          const values = Object.values(data);
          
          const query = `
            INSERT INTO "PaymentTransaction" (${columns})
            VALUES (${placeholders})
            RETURNING *
          `;
          
          const result = await prisma.$queryRawUnsafe(query, ...values);
          return result[0];
        },
        async update(args) {
          const { where, data } = args;
          
          // Construir la parte SET
          const updateSet = Object.entries(data)
            .map(([key, value], index) => {
              if (key === 'metadata' && typeof value === 'object') {
                return `"${key}" = $${index + 1}::jsonb`;
              }
              return `"${key}" = $${index + 1}`;
            })
            .join(', ');
          
          const values = Object.values(data);
          
          // Construir la cláusula WHERE
          let whereClause = '';
          if (where.id) {
            whereClause = `WHERE "id" = $${values.length + 1}`;
            values.push(where.id);
          } else if (where.transactionId) {
            whereClause = `WHERE "transactionId" = $${values.length + 1}`;
            values.push(where.transactionId);
          }
          
          const query = `
            UPDATE "PaymentTransaction"
            SET ${updateSet}
            ${whereClause}
            RETURNING *
          `;
          
          const result = await prisma.$queryRawUnsafe(query, ...values);
          return result[0];
        }
      },
      
      // Aseguramos que PaymentRefund esté disponible
      paymentRefund: {
        async create(args) {
          const { data } = args;
          const columns = Object.keys(data).map(k => `"${k}"`).join(', ');
          const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
          const values = Object.values(data);
          
          const query = `
            INSERT INTO "PaymentRefund" (${columns})
            VALUES (${placeholders})
            RETURNING *
          `;
          
          const result = await prisma.$queryRawUnsafe(query, ...values);
          return result[0];
        },
        async update(args) {
          const { where, data } = args;
          
          // Construir la parte SET
          const updateSet = Object.entries(data)
            .map(([key, value], index) => `"${key}" = $${index + 1}`)
            .join(', ');
          
          const values = Object.values(data);
          
          // Construir la cláusula WHERE
          let whereClause = '';
          if (where.id) {
            whereClause = `WHERE "id" = $${values.length + 1}`;
            values.push(where.id);
          } else if (where.refundId) {
            whereClause = `WHERE "refundId" = $${values.length + 1}`;
            values.push(where.refundId);
          }
          
          const query = `
            UPDATE "PaymentRefund"
            SET ${updateSet}
            ${whereClause}
            RETURNING *
          `;
          
          const result = await prisma.$queryRawUnsafe(query, ...values);
          return result[0];
        },
        async aggregate(args) {
          const { where, _sum } = args;
          
          let selectClause = 'COUNT(*)';
          if (_sum && _sum.amount) {
            selectClause = 'SUM(amount)';
          }
          
          let whereClause = '';
          const values = [];
          if (where && where.paymentTransactionId) {
            whereClause = `WHERE "paymentTransactionId" = $1`;
            values.push(where.paymentTransactionId);
          }
          
          const query = `
            SELECT ${selectClause} as result
            FROM "PaymentRefund"
            ${whereClause}
          `;
          
          const result = await prisma.$queryRawUnsafe(query, ...values);
          
          // Formato esperado para el resultado de aggregate
          if (_sum && _sum.amount) {
            return {
              _sum: {
                amount: Number(result[0].result) || 0
              }
            };
          }
          
          return {
            _count: Number(result[0].result)
          };
        }
      }
    }
  });
}