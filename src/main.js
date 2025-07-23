/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  const discountDecimal = discount / 100;
  const fullPrice = sale_price * quantity;
  const revenue = fullPrice * (1 - discountDecimal); // Считаем, сколько реально заплатили, то есть с учётом скидки (1 - скидка/100 — это доля оставшейся суммы после скидки).
  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

//(index, total, seller) — данные, которые функция получает для расчёта бонуса.
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller; // вытаскиваем profit для расчета в функции
  if (index === 0) return profit * 0.15; // Если позиция 0 — значит, он лидер, и получает 15% бонуса от своей прибыли.
  if (index === 1 || index === 2) return profit * 0.1; // Если позиция 1 или 2 — второй и третий в рейтинге, получают 10%.
  if (index < total - 1) return profit * 0.05; // Все продавцы, кроме последнего, так как их позиция меньше, чем индекс последнего.
  return 0; // Если не попали ни под одно условие, значит это последний продавец, и он получает 0 бонусов.
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций
  if (typeof options !== "object" || options === null) {
    throw new Error("Не передан объект настроек");
  }

  const { calculateRevenue, calculateBonus } = options;

  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Не переданы корректные функции расчёта");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller])
  );
  const productIndex = Object.fromEntries(
    data.products.map((product) => [product.sku, product])
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;
    seller.sales_count += 1; // Увеличить количество продаж
    let totalAmount = 0; // Увеличить общую сумму всех продаж

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;
      const cost = product.purchase_price * item.quantity;
      const revenue = calculateRevenue(item, product);
      const profit = revenue - cost;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;

      totalAmount += revenue;
    });

    // @TODO: Сортировка продавцов по прибыли
    seller.revenue += totalAmount;
  });

  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
