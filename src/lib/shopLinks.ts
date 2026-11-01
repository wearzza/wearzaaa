export type ShopIdentity = { id: string; shop_slug?: string };
export const shopHandle = (seller: ShopIdentity) => seller.shop_slug || seller.id.slice(0, 8);
export const shopUrl = (seller: ShopIdentity) => `https://wearza.lovable.app/s/${shopHandle(seller)}`;