const express = require('express')
const cors = require('cors')
const fetch = global.fetch
const app = express()

app.use(cors())
app.use(express.json())

app.get('/test', (req, res) => {
  res.json({ message: 'Backend OK' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})

// const mysql = require('mysql2')

// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '1710SG',
//   database: 'webshop'
// })

// db.connect(err => {
//   if (err) {
//     console.error('DB接続エラー:', err)
//     return
//   }
//   console.log('DB接続成功！')
// })

// app.post('/login', (req, res) => {
//   const { email, password } = req.body

//   db.query(
//     'SELECT * FROM m_user WHERE mail_address = ? AND password = ?',
//     [email, password],
//     (err, results) => {
//       if (err) {
//         return res.status(500).json(err)
//       }

//       if (results.length === 0) {
//         return res.status(401).json({ message: 'ログイン失敗' })
//       }

//       // ✅ 成功
//       res.json(results[0])
//     }
//   )
// })
app.post('/login', (req, res) => {
  res.json({
    user_id: 1,
    name: "テストユーザー"
  })
})


app.post('/register', (req, res) => {
  const {
    company_name,
    company_kana,
    user_name,
    user_kana,
    department,
    postal_code,
    address,
    email,
    phone,
    password
  } = req.body

  db.query(
    `INSERT INTO m_user 
    (company_name, company_kana, user_name, user_kana, department,
     postal_code, address, mail_address, phone, password)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      company_name,
      company_kana,
      user_name,
      user_kana,
      department,
      postal_code,
      address,
      email,
      phone,
      password
    ],
    (err) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: '登録失敗' })
      }

      res.json({ message: '登録成功' })
    }
  )
})

// app.get('/products', (req, res) => {
  // db.query('SELECT * FROM m_product', (err, results) => {
  //   if (err) {
  //     return res.status(500).json(err)
  //   }
  //   res.json(results)
  // })
// })
app.get('/products', (req, res) => {
  res.json([
    { id: 1, name: "テスト商品A", price: 1000 },
    { id: 2, name: "テスト商品B", price: 2000 }
  ])
})

// 商品データを外部APIから取得してDBに入れる
app.get('/import-products', async (req, res) => {
  try {
    const response = await fetch('https://fakestoreapi.com/products')
    const products = await response.json()

    for (const p of products) {
      await new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO m_product 
          (product_name, price, category, description, image_path, rating, review_count) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            p.title,
            p.price,
            p.category,
            p.description,
            p.image,
            p.rating.rate,
            p.rating.count
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    }

    res.send('商品データをインポートしました！')
  } catch (err) {
    console.error(err)
    res.status(500).send('エラー発生')
  }
})

app.get('/products/category/:category', (req, res) => {
  const { category } = req.params

  db.query(
    'SELECT * FROM m_product WHERE category = ?',
    [category],
    (err, results) => {
      if (err) return res.status(500).json(err)
      res.json(results)
    }
  )
})

app.get('/categories', (req, res) => {
  db.query(
    'SELECT DISTINCT category FROM m_product',
    (err, results) => {
      if (err) return res.status(500).json(err)
      
      const categories = results.map(r => r.category)
      res.json(categories)
    }
  )
})

// 商品詳細（1件取得）
app.get('/products/:id', (req, res) => {
  const { id } = req.params

  db.query(
    'SELECT * FROM m_product WHERE product_id = ?',
    [id],
    (err, results) => {
      if (err) {
        return res.status(500).json(err)
      }

      if (results.length === 0) {
        return res.status(404).json({ message: '商品が見つかりません' })
      }

      res.json(results[0]) // ←ここ重要（1件）
    }
  )
})

app.put('/user/:id', (req, res) => {
  const { id } = req.params

  const {
    company_name,
    company_kana,
    user_name,
    user_kana,
    department,
    postal_code,
    address,
    email,
    phone,
    password
  } = req.body

  db.query(
    `UPDATE m_user SET
      company_name = ?,
      company_kana = ?,
      user_name = ?,
      user_kana = ?,
      department = ?,
      postal_code = ?,
      address = ?,
      mail_address = ?,
      phone = ?,
      password = ?
     WHERE user_id = ?`,
    [
      company_name,
      company_kana,
      user_name,
      user_kana,
      department,
      postal_code,
      address,
      email,
      phone,
      password,
      id
    ],
    (err) => {
      if (err) return res.status(500).json(err)
      res.json({ message: '更新成功' })
    }
  )
})

app.get('/cart/:userId', (req, res) => {
  const { userId } = req.params

  db.query(
    `
    SELECT 
      d.cart_detail_id,
      d.product_id,
      d.quantity,
      p.product_name,
      p.price_jpy,
      p.image_path,
      p.display_id, 
      c.cart_id
    FROM t_cart c
    JOIN t_cart_detail d ON c.cart_id = d.cart_id
    JOIN m_product p ON d.product_id = p.product_id
    WHERE c.user_id = ?
    `,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err)
      res.json(results)
    }
  )
})


app.post('/cart', (req, res) => {
  const { user_id, product_id, quantity } = req.body

  // ① cart取得
  db.query(
    'SELECT cart_id FROM t_cart WHERE user_id = ?',
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json(err)

      let cartId

      if (results.length === 0) {
        // cart作成
        db.query(
          'INSERT INTO t_cart (user_id) VALUES (?)',
          [user_id],
          (err, result) => {
            if (err) return res.status(500).json(err)

            cartId = result.insertId
            handleDetail(cartId)
          }
        )
      } else {
        cartId = results[0].cart_id
        handleDetail(cartId)
      }
    }
  )

  // ② detail処理
  const handleDetail = (cartId) => {

    // ✅ 既存チェック
    db.query(
      `SELECT * FROM t_cart_detail 
       WHERE cart_id = ? AND product_id = ?`,
      [cartId, product_id],
      (err, rows) => {
        if (err) return res.status(500).json(err)

        if (rows.length > 0) {
          // ✅ UPDATE
          db.query(
            `UPDATE t_cart_detail 
             SET quantity = quantity + ?
             WHERE cart_id = ? AND product_id = ?`,
            [quantity, cartId, product_id],
            (err) => {
              if (err) return res.status(500).json(err)
              res.json({ message: '数量更新' })
            }
          )
        } else {
          // ✅ INSERT
          db.query(
            `INSERT INTO t_cart_detail (cart_id, product_id, quantity)
             VALUES (?, ?, ?)`,
            [cartId, product_id, quantity],
            (err) => {
              if (err) return res.status(500).json(err)
              res.json({ message: '追加成功' })
            }
          )
        }
      }
    )
  }
})


app.delete('/cart/:detailId', (req, res) => {
  const { detailId } = req.params

  db.query(
    'DELETE FROM t_cart_detail WHERE cart_detail_id = ?',
    [detailId],
    (err) => {
      if (err) return res.status(500).json(err)
      res.json({ message: '削除成功' })
    }
  )
})

app.put('/cart', (req, res) => {
  const { cart_detail_id, quantity } = req.body

  db.query(
    `UPDATE t_cart_detail 
     SET quantity = ?
     WHERE cart_detail_id = ?`,
    [quantity, cart_detail_id],
    (err) => {
      if (err) return res.status(500).json(err)
      res.json({ message: '更新成功' })
    }
  )
})

app.post('/order', (req, res) => {
  const { user_id, cart } = req.body

  // ✅ 合計金額
  const totalPrice = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)

  // ✅ order作成
  db.query(
    `INSERT INTO t_order (user_id, total_price) VALUES (?, ?)`,
    [user_id, totalPrice],
    (err, result) => {
      if (err) return res.status(500).json(err)

      const orderId = result.insertId

      // ✅ 表示用注文番号生成
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')

      const orderNumber = `ORD-${y}${m}${d}-${String(orderId).padStart(6, '0')}`

      // ✅ order_number更新
      db.query(
        `UPDATE t_order SET order_number = ? WHERE order_id = ?`,
        [orderNumber, orderId]
      )

      // ✅ detail登録
      const values = cart.map(item => [
        orderId,
        item.id,
        item.quantity,
        item.price
      ])

      db.query(
        `INSERT INTO t_order_detail 
         (order_id, product_id, quantity, price)
         VALUES ?`,
        [values],
        (err) => {
          if (err) return res.status(500).json(err)

          // ✅ カート削除
          db.query(
            `DELETE d FROM t_cart_detail d
             JOIN t_cart c ON d.cart_id = c.cart_id
             WHERE c.user_id = ?`,
            [user_id]
          )

          // ✅ 結果返す
          res.json({
            message: '注文完了',
            order_id: orderId,
            order_number: orderNumber,
            order_date: now
          })
        }
      )
    }
  )
})

app.get('/orders/:userId', (req, res) => {
  const { userId } = req.params

  db.query(
    `
    SELECT 
      o.order_id,
      o.order_number,
      o.total_price,
      o.order_date,
      o.status
    FROM t_order o
    WHERE o.user_id = ?
    ORDER BY o.order_date DESC
    `,
    [userId],
    (err, orders) => {
      if (err) return res.status(500).json(err)

      if (orders.length === 0) {
        return res.json([])
      }

      // ✅ 明細取得
      const orderIds = orders.map(o => o.order_id)

      db.query(
        `
        SELECT 
          d.order_id,
          d.product_id,
          d.quantity,
          d.price,
          p.product_name
        FROM t_order_detail d
        JOIN m_product p ON d.product_id = p.product_id
        WHERE d.order_id IN (?)
        `,
        [orderIds],
        (err, details) => {
          if (err) return res.status(500).json(err)

          // ✅ 合体
          const result = orders.map(order => ({
            id: order.order_id,
            orderNumber: order.order_number,
            date: order.order_date,
            status: order.status,
            items: details
              .filter(d => d.order_id === order.order_id)
              .map(d => ({
                id: d.product_id,
                name: d.product_name,
                price: d.price,
                quantity: d.quantity
              }))
          }))

          res.json(result)
        }
      )
    }
  )
})

app.get('/order/:orderId', (req, res) => {
  const { orderId } = req.params

  // ✅ ヘッダ取得
  db.query(
    `
    SELECT order_id, order_number, order_date, status
    FROM t_order
    WHERE order_id = ?
    `,
    [orderId],
    (err, orders) => {
      if (err) return res.status(500).json(err)
      if (orders.length === 0) return res.status(404).json({})

      const order = orders[0]

      // ✅ 明細取得
      db.query(
        `
        SELECT 
          d.product_id,
          d.quantity,
          d.price,
          p.product_name,
          p.display_id
        FROM t_order_detail d
        JOIN m_product p ON d.product_id = p.product_id
        WHERE d.order_id = ?
        `,
        [orderId],
        (err, details) => {
          if (err) return res.status(500).json(err)

          res.json({
            id: order.order_id,
            orderNumber: order.order_number,
            date: order.order_date,
            status: order.status,
            items: details.map(d => ({
              id: d.product_id,
              display_id: d.display_id,
              name: d.product_name,
              price: d.price,
              quantity: d.quantity
            }))
          })
        }
      )
    }
  )
})

app.delete('/order/:orderId', (req, res) => {
  const { orderId } = req.params

  // ✅ ① 明細削除
  db.query(
    'DELETE FROM t_order_detail WHERE order_id = ?',
    [orderId],
    (err) => {
      if (err) return res.status(500).json(err)

      // ✅ ② ヘッダ削除
      db.query(
        'DELETE FROM t_order WHERE order_id = ?',
        [orderId],
        (err) => {
          if (err) return res.status(500).json(err)

          res.json({ message: '削除成功' })
        }
      )
    }
  )
})