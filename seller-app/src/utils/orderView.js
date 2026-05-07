export const getCurrentSellerId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?._id || user?.id || null;
  } catch {
    return null;
  }
};

export const getSellerLabel = (seller) => {
  if (!seller) return 'Unknown seller';
  if (typeof seller === 'object') {
    return seller.businessName || seller.name || 'Unknown seller';
  }
  return 'Unknown seller';
};

export const filterOrderForCurrentSeller = (order) => {
  if (!order) return null;

  const sellerId = getCurrentSellerId();
  const orderObject = typeof order.toObject === 'function' ? order.toObject() : { ...order };

  const items = (orderObject.items || []).filter((item) => {
    const sellerRef = item?.product?.sellerId;
    const sellerRefId = typeof sellerRef === 'object' ? sellerRef._id || sellerRef.id : sellerRef;
    return sellerId && String(sellerRefId) === String(sellerId);
  });

  if (!sellerId || items.length === 0) {
    return null;
  }

  const totalPrice = items.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);

  return {
    ...orderObject,
    items,
    totalPrice,
  };
};