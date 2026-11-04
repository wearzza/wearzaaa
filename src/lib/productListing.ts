// Moderation hides a listing without deleting the product or historical order items.
export function hiddenListingUpdate() {
  return { is_active: false, updated_at: new Date().toISOString() };
}

export function listingActiveOnSave(editing: { is_active: boolean } | null) {
  return editing ? editing.is_active : true;
}