import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Catalog from './pages/catalog'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import AdminLayout from './pages/AdminLayout'
import AdminOrders from './pages/AdminOrders'
import AdminOrder from './pages/AdminOrder'
import AdminProducts from './pages/AdminProducts'
import AdminProductForm from './pages/AdminProductForm'
import AdminCategories from './pages/AdminCategories'
import AdminCustomers from './pages/AdminCustomers'
import AdminCustomer from './pages/AdminCustomer'

export default function App() {
  const isAdmin = useLocation().pathname.startsWith('/admin')

  return (
    <div className="app">
      {!isAdmin && <Navbar />}
      <main className={isAdmin ? '' : 'main'}>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/produits" element={<Products />} />
          <Route path="/produit/:id" element={<ProductDetail />} />
          <Route path="/panier" element={<Cart />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOrders />} />
            <Route path="commande/:id" element={<AdminOrder />} />
            <Route path="produits" element={<AdminProducts />} />
            <Route path="produits/nouveau" element={<AdminProductForm />} />
            <Route path="produits/:id/modifier" element={<AdminProductForm />} />
            <Route path="rubriques" element={<AdminCategories />} />
            <Route path="clients" element={<AdminCustomers />} />
            <Route path="clients/:key" element={<AdminCustomer />} />
          </Route>
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  )
}