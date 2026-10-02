import img1 from './assets/products/products01.jpeg'
import img2 from './assets/products/products02.jpg'
import img3 from './assets/products/products03.jpg'
import img4 from './assets/products/products04.jpg'

const images = [img1, img2, img3, img4]

// produit id 1 → image 1, id 2 → image 2, etc.
export function getProductImage(product) {
  return images[(Number(product.id) - 1) % images.length]
}