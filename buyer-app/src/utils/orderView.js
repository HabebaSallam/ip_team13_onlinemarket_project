export const getSellerIdValue = (seller) => {
  if (!seller) return null;
  if (typeof seller === 'object') {
    return seller._id || seller.id || null;
  }
  return seller;
};

export const getSellerLabel = (seller) => {
  if (!seller) return 'Unknown seller';
  if (typeof seller === 'object') {
    return seller.businessName || seller.name || 'Unknown seller';
  }
  return 'Unknown seller';
};

export const groupItemsBySeller = (items = []) => {
  const groups = new Map();

  items.forEach((item, index) => {
    const seller = item?.product?.sellerId;
    const sellerKey = String(getSellerIdValue(seller) || item?._id || item?.product?._id || `unknown-${index}`);
    const sellerLabel = getSellerLabel(seller);

    if (!groups.has(sellerKey)) {
      groups.set(sellerKey, {
        sellerKey,
        sellerLabel,
        seller,
        items: [],
        total: 0,
      });
    }

    const group = groups.get(sellerKey);
    const quantity = Number(item?.quantity || 0);
    const price = Number(item?.price || 0);

    group.items.push(item);
    group.total += price * quantity;
  });

  return Array.from(groups.values());
};

export const formatSellerSummary = (items = []) => {
  const groups = groupItemsBySeller(items);

  if (groups.length === 0) return 'Unknown seller';
  if (groups.length === 1) return groups[0].sellerLabel;

  const names = groups.map((group) => group.sellerLabel).filter(Boolean);
  return `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2} more` : ''}`;
};