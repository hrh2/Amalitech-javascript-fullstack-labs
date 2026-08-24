/**
 * Shape of a single dessert as provided by the design data source.
 * `id` is derived at load time (data.json has no id) so every dessert
 * can be tracked reliably (e.g. for *ngFor trackBy and cart lookups).
 */
export interface DessertImages {
  thumbnail: string;
  mobile: string;
  tablet: string;
  desktop: string;
}

export interface Dessert {
  id: number;
  name: string;
  category: string;
  price: number;
  image: DessertImages;
}

/**
 * A dessert combined with the quantity currently in the cart.
 * Used wherever the cart's contents are displayed (cart panel + confirmation modal).
 */
export interface CartLine {
  dessert: Dessert;
  quantity: number;
}
