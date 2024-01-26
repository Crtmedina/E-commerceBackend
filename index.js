/**
 * Backend para la aplicación de comercio electrónico.
 * 
 * - Utiliza Express para manejar las rutas y middleware.
 * - Conexión a MongoDB para almacenar datos de productos y usuarios.
 * - Autenticación mediante JWT.
 * - Manejo de imágenes con Multer.
 * - Endpoints para agregar/eliminar productos, registro/inicio de sesión de usuarios, gestión de carrito, etc.
 */

// Configuración del puerto y librerías necesarias
const port = process.env.PORT || 4000;
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require("cors");

require('dotenv').config();
// Configuración de Express y conexión a MongoDB
app.use(express.json());
app.use(cors());
mongoose.connect(process.env.MONGO_URL)


// Documentación para la ruta principal
/**
 * @route GET /
 * @description Ruta principal que indica si el servidor está en funcionamiento.
 * @access Público
 */
app.get("/", ( req, res) => {
    res.send("Express App is Running")
})

// Iniciar el servidor
app.listen(port, (error) => {
    if ( !error ) {
        console.log("Server Running on Port " + port);
    } else {
        console.log("Error: " + error);
    }
})

/**
 * Configuración del almacenamiento de imágenes utilizando Multer.
 * 
 * - Establece la carpeta de destino donde se guardarán las imágenes.
 * - Define un esquema para nombrar los archivos basado en el nombre original y la fecha actual.
 */
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: ( req, file, cb ) => {
        return cb( null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}` )
    }
})


/**
 * Configuración de Multer para el manejo de la carga de imágenes.
 * 
 * - Utiliza la configuración de almacenamiento previamente definida.
 */
const upload = multer({storage: storage })

// --- Creando punto de carga para imágenes---

app.use('/images', express.static('upload/images'))
// Esto permite que las imágenes cargadas estén disponibles en el punto de acceso /images.

// punto de acceso POST /upload que utiliza el middleware upload.single('product') para manejar la carga de imágenes. Devuelves una respuesta JSON con la URL de la imagen recién cargada.
app.post("/upload", upload.single('product'), ( req, res ) => {
    res.json({ 
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})

// Esquema para crear Products

const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    }
})


/**
 * Ruta para agregar un nuevo producto a la base de datos.
 * 
 * - Recupera la lista de productos existentes.
 * - Calcula el nuevo ID para el producto a partir del último producto en la lista.
 * - Crea una nueva instancia de producto con los datos proporcionados en la solicitud.
 * - Guarda el nuevo producto en la base de datos.
 * - Devuelve una respuesta JSON indicando el éxito de la operación y el nombre del producto agregado.
 * 
 * @route POST /addproduct
 * @method POST
 * @param {Object} req - Objeto de solicitud de Express que contiene los datos del producto a agregar.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {void}
 */
app.post('/addproduct', async (req, res) => {
    try {
        // Recupera la lista de productos existentes
        let products = await Product.find({});

        let id;
        // Calcula el nuevo ID para el producto a partir del último producto en la lista
        if (products.length > 0) {
            let lastProductArray = products.slice(-1);
            let lastProduct = lastProductArray[0];
            id = lastProduct.id + 1;
        } else {
            id = 1;
        }

        // Crea una nueva instancia de producto con los datos proporcionados en la solicitud
        const product = new Product({
            id: id,
            name: req.body.name,
            image: req.body.image,
            category: req.body.category,
            new_price: req.body.new_price,
            old_price: req.body.old_price,
        });

        console.log(product);

        // Guarda el nuevo producto en la base de datos
        await product.save();
        console.log("Product Saved");

        // Devuelve una respuesta JSON indicando el éxito de la operación y el nombre del producto agregado
        res.json({
            success: true,
            name: req.body.name,
        });
    } catch (error) {
        console.error("Error adding product:", error);
        // Devuelve una respuesta JSON en caso de error
        res.status(500).json({
            success: false,
            error: "Error adding product to the database.",
        });
    }
});


/**
 * Ruta para eliminar un producto de la base de datos.
 * 
 * - Utiliza el ID proporcionado en la solicitud para encontrar y eliminar el producto correspondiente.
 * - Devuelve una respuesta JSON indicando el éxito de la operación y el nombre del producto eliminado.
 * 
 * @route POST /removeproduct
 * @method POST
 * @param {Object} req - Objeto de solicitud de Express que contiene el ID del producto a eliminar.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {void}
 */
app.post('/removeproduct', async (req, res) => {
    try {
        // Utiliza el ID proporcionado en la solicitud para encontrar y eliminar el producto correspondiente
        await Product.findOneAndDelete({ id: req.body.id });
        console.log("Product Removed");

        // Devuelve una respuesta JSON indicando el éxito de la operación y el nombre del producto eliminado
        res.json({
            success: true,
            name: req.body.name,
        });
    } catch (error) {
        console.error("Error removing product:", error);
        // Devuelve una respuesta JSON en caso de error
        res.status(500).json({
            success: false,
            error: "Error removing product from the database.",
        });
    }
});

// Creando Api para tomar o ver todos los productos ( GET );

app.get('/allproducts', async( req, res )=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

// Creando Esquema Usuarios Modelo

const Users = mongoose.model('Users',{
    name:{
        type: String,
    },
    email:{
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

const secretKey = process.env.SECRET_KEY || 'default_secret';

// Creando Enpoint para el registro de usuarios

app.post('/signup', async(req, res)=>{

    let check = await Users.findOne({
        email:req.body.email
    });

    if(check) {
        return res.status( 400 ).json({
            success: false, errors: "Existing user found with same email address"
        })
    }

    let cart = {};

    for (let i = 0; i < 300; i++) {
        cart[i]=0;
    }

    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    })

    await user.save();

    const data = {
        user: {
            id: user.id
        }
    }

    const token = jwt.sign(data, secretKey);
    res.json({success: true, token })
})

// Creando un endpoint para el inicio de sesión de usuario.

app.post('/login', async( req, res ) => {
    
    let user = await Users.findOne({
        email: req.body.email,
    })

    if(user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, secretKey);
            res.json({
                success: true,
                token
            })
        } else {
            res.json({
                success: false,
                errors: 'Wrong Password'
            })
        }
    } else {
        res.json({
            success: false,
            errors: 'Wrong Email Id',
        })
    }
})

// Creating endpoint for newcollections data

app.get('/newcollections', async( req, res ) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log('NewCollection Fetched')
    res.send(newcollection);
})

// Creating EndPoint for popular in women section

app.get('/popularinwomen', async( req, res) => {
    let products = await Product.find({category: "women"})
    let popular_in_women = products.slice(0,4);
    console.log("Popular in women fetched")
    res.send(popular_in_women);
})

// Creating middelware to fetch user
const fetchUser = async( req, res, next ) => {
    const token = req.header('auth-token');
    if (!token ) {
        res.status( 401 ).send({ errors: "Please authenticated using valid token"})
    } else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status( 401 ).send({errors: "Please authenticated using a valid token"})
        }
    }
}

// Creating endpoint for adding products in cartdata
app.post('/addtocart',fetchUser, async( req, res ) => {
    // console.log(req.body, req.user)
    console.log("Added", req.body.itemId );
    let userData = await Users.findOne({_id: req.user.id });
    userData.cartData[ req.body.itemId ] += 1;
    await Users.findOneAndUpdate(
         {_id: req.user.id }, 
         {cartData: userData.cartData }
     );
    res.send("Added")
})

// Creating EndPoint to remove product from cartdata

app.post('/removefromcart', fetchUser, async( req, res )=> {

     console.log("Removed", req.body.itemId );
     let userData = await Users.findOne({_id: req.user.id });
     if( userData.cartData[ req.body.itemId ] > 0 )
     userData.cartData[ req.body.itemId ] -= 1;
     await Users.findOneAndUpdate(
         {_id: req.user.id }, 
         {cartData: userData.cartData }
     );
     res.send("Removed")
})

// Creating endpoint to get cartdata

app.post('/getcart', fetchUser, async( req, res )=> {
    console.log("GetCart");
    let userData = await Users.findOne({_id: req.user.id });
    res.json( userData.cartData);
})
