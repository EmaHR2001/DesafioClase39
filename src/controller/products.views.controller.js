const ProductServices = require("../dao/mongo/services/products.services");
const Service = new ProductServices();

const getProductsViews = async (req, res) => {
  const { limit, page, sort, ...data } = req.query;
  const productData = await Service.getAll(page, limit, sort, data);
  const products = productData.docs.map((item) => {
    return {
      title: item.title,
      description: item.description,
      price: item.price, 
      thumbnail: item.thumbnail,
      code: item.code,
      stock: item.stock,
      category: item.category,
      status: true,
      _id: item._id,
    };
  });

  const { docs, ...rest } = productData;
  let links = [];

  for (let i = 1; i < rest.totalPages + 1; i++) {
    links.push({ label: i, href: "http://localhost:8080/products/?page=" + i });
  }
  if (req.session.user){
    let session = req.session.user
    let rol = req.session.user.rol  
    const data={
      products: products,
      pagination: rest,
      links: links,
      style: "products.css",
      title: "Products",
    }
    data[rol] = session
    return res.status(201).render("products", data );

  }
  else{
    return res.status(201).render("products", {
      products: products,
      pagination: rest,
      links: links,
      style: "products.css",
      title: "Products",
    
    });

  }

}

const getProductsViewsError = (req, res) => {
  res.render("error404", {
    style: "error404.css",
    title: "Error 404",
  });
}

module.exports = {
  getProductsViews,
  getProductsViewsError
}