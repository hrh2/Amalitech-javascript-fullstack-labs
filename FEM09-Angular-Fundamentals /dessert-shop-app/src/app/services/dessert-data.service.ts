import { Injectable } from '@angular/core';
import { Dessert } from '../models/dessert.model';

/**
 * Provides the dessert catalog for the shop.
 *
 * The data mirrors the project's data.json exactly (name, category, price,
 * image set) with a stable numeric `id` added, since the source data has
 * none and the app needs a reliable key for cart lookups and *ngFor tracking.
 *
 * This is a plain injectable service (no HttpClient/RxJS) so the data is
 * available synchronously wherever it's injected.
 */
@Injectable({
  providedIn: 'root'
})
export class DessertDataService {
  private readonly desserts: Dessert[] = [
    {
      id: 1,
      name: 'Waffle with Berries',
      category: 'Waffle',
      price: 6.5,
      image: {
        thumbnail: 'assets/images/image-waffle-thumbnail.jpg',
        mobile: 'assets/images/image-waffle-mobile.jpg',
        tablet: 'assets/images/image-waffle-tablet.jpg',
        desktop: 'assets/images/image-waffle-desktop.jpg'
      }
    },
    {
      id: 2,
      name: 'Vanilla Bean Crème Brûlée',
      category: 'Crème Brûlée',
      price: 7.0,
      image: {
        thumbnail: 'assets/images/image-creme-brulee-thumbnail.jpg',
        mobile: 'assets/images/image-creme-brulee-mobile.jpg',
        tablet: 'assets/images/image-creme-brulee-tablet.jpg',
        desktop: 'assets/images/image-creme-brulee-desktop.jpg'
      }
    },
    {
      id: 3,
      name: 'Macaron Mix of Five',
      category: 'Macaron',
      price: 8.0,
      image: {
        thumbnail: 'assets/images/image-macaron-thumbnail.jpg',
        mobile: 'assets/images/image-macaron-mobile.jpg',
        tablet: 'assets/images/image-macaron-tablet.jpg',
        desktop: 'assets/images/image-macaron-desktop.jpg'
      }
    },
    {
      id: 4,
      name: 'Classic Tiramisu',
      category: 'Tiramisu',
      price: 5.5,
      image: {
        thumbnail: 'assets/images/image-tiramisu-thumbnail.jpg',
        mobile: 'assets/images/image-tiramisu-mobile.jpg',
        tablet: 'assets/images/image-tiramisu-tablet.jpg',
        desktop: 'assets/images/image-tiramisu-desktop.jpg'
      }
    },
    {
      id: 5,
      name: 'Pistachio Baklava',
      category: 'Baklava',
      price: 4.0,
      image: {
        thumbnail: 'assets/images/image-baklava-thumbnail.jpg',
        mobile: 'assets/images/image-baklava-mobile.jpg',
        tablet: 'assets/images/image-baklava-tablet.jpg',
        desktop: 'assets/images/image-baklava-desktop.jpg'
      }
    },
    {
      id: 6,
      name: 'Lemon Meringue Pie',
      category: 'Pie',
      price: 5.0,
      image: {
        thumbnail: 'assets/images/image-meringue-thumbnail.jpg',
        mobile: 'assets/images/image-meringue-mobile.jpg',
        tablet: 'assets/images/image-meringue-tablet.jpg',
        desktop: 'assets/images/image-meringue-desktop.jpg'
      }
    },
    {
      id: 7,
      name: 'Red Velvet Cake',
      category: 'Cake',
      price: 4.5,
      image: {
        thumbnail: 'assets/images/image-cake-thumbnail.jpg',
        mobile: 'assets/images/image-cake-mobile.jpg',
        tablet: 'assets/images/image-cake-tablet.jpg',
        desktop: 'assets/images/image-cake-desktop.jpg'
      }
    },
    {
      id: 8,
      name: 'Salted Caramel Brownie',
      category: 'Brownie',
      price: 4.5,
      image: {
        thumbnail: 'assets/images/image-brownie-thumbnail.jpg',
        mobile: 'assets/images/image-brownie-mobile.jpg',
        tablet: 'assets/images/image-brownie-tablet.jpg',
        desktop: 'assets/images/image-brownie-desktop.jpg'
      }
    },
    {
      id: 9,
      name: 'Vanilla Panna Cotta',
      category: 'Panna Cotta',
      price: 6.5,
      image: {
        thumbnail: 'assets/images/image-panna-cotta-thumbnail.jpg',
        mobile: 'assets/images/image-panna-cotta-mobile.jpg',
        tablet: 'assets/images/image-panna-cotta-tablet.jpg',
        desktop: 'assets/images/image-panna-cotta-desktop.jpg'
      }
    }
  ];

  /** Returns the full dessert catalog. Returns a copy so callers can't mutate the source list. */
  getDesserts(): Dessert[] {
    return [...this.desserts];
  }
}
