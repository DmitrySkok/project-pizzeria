/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },

    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Cart {
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();

      // console.log('new Cart: ', thisCart);
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;

      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    }

    initActions() {
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function () {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function () {
        thisCart.update;
      });
      thisCart.dom.productList.addEventListener('remove', function (event) {
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });
    }

    remove() {
      const thisCart = this;
      thisCart.dom.productList.remove();

      thisCart.products.splice(0);
      console.log('splice thisCart.products: ', thisCart.products);
      thisCart.update();
    }

    sendOrder() {
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.orders;
      const payload = {
        phone: thisCart.dom.phone.value,
        address: thisCart.dom.address.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: []
      };
      for(let prod of thisCart.products) {
        console.log('prod: ', prod);
        payload.products.push(prod.getData());
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      
      fetch(url, options);

    }

    add(menuProduct) {
      const thisCart = this;
      /* generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct);
      /* create element using utils.createElementFromHTML */
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      /* add to productList using appendChild */
      thisCart.dom.productList.appendChild(generatedDOM);
      // console.log('adding product: ', menuProduct);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      // console.log('thisCart.products: ', thisCart.products);
      thisCart.update();
    }

    update() {
      const thisCart = this;

      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0; //całościowa liczba sztuk
      thisCart.subTotalPrice = 0; // zsumowana cena za wszystko

      for (const product of thisCart.products) {
        thisCart.totalNumber += product.amount;
        thisCart.subTotalPrice += product.price;
      }

      if (thisCart.totalNumber == 0) {
        thisCart.deliveryFee = 0;
        thisCart.totalPrice = 0;
      } else {
        thisCart.totalPrice = thisCart.deliveryFee + thisCart.subTotalPrice;
      }
      for (let price of thisCart.dom.totalPrice) { // but totalPrice its Array
        price.innerHTML = thisCart.totalPrice;
      }
      console.log('totalPrice: ', thisCart.totalPrice);
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subTotalPrice;
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
    }


  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;

      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initAction();

      // console.log('AmountWidget: ', thisWidget);
      // console.log('constructor arguments: ', element);
    }

    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value) {
      const thisWidget = this;

      const newValue = parseInt(value);

      /* TODO: Add validation */
      if (thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }

    initAction() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });

      // console.log('initAction: ', thisWidget);
    }

    announce() {
      const thisWidget = this;

      const event = new CustomEvent('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }

  }

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.params = menuProduct.params;


      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();

      // console.log('thisCartProduct: ', thisCartProduct);
    }

    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;

      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget() {
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

      thisCartProduct.amountWidget.element.addEventListener('updated', function () {
        let price = thisCartProduct.price;
        price *= thisCartProduct.amountWidget.value;
        thisCartProduct.priceSingle = price;
        thisCartProduct.dom.price.innerHTML = price;
      });
    }

    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function (event) {
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function (event) {
        event.preventDefault();
        thisCartProduct.remove();
        console.log('remove.addEventListener: ', thisCartProduct);
      });
    }

    getData() {
      const thisCartProduct = this;
      thisCartProduct.dataSummary = {
        id: thisCartProduct.id,
        name: thisCartProduct.name,
        amount: thisCartProduct.amount,
        priceSingle: thisCartProduct.priceSingle,
        price: thisCartProduct.price,
        params: thisCartProduct.params
      };
      return thisCartProduct.dataSummary;
    }
  }

  const app = {
    initMenu: function () {
      const thisApp = this;
      // console.log('thisApp.data: ', thisApp.data);
      for (let productData in thisApp.data.products) {
        // new Product(productData, thisApp.data.products[productData]);
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    initData: function () {
      const thisApp = this;

      // thisApp.data = dataSource;
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url)
        .then(function (rawResponse) {
          return rawResponse.json();
        })
        .then(function (parsedResponse) {
          console.log('parsedResponse: ', parsedResponse);
          thisApp.data.products = parsedResponse;
          thisApp.initMenu();
        });
    },

    init: function () {
      const thisApp = this;
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);

      thisApp.initData();
      // thisApp.initMenu();
      thisApp.initCart();
    },

    initCart: function () {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    /* parsedResponse: function () {
      fetch(url)
        .then(function (rawResponse) {
          return rawResponse.json();
        })
        .then(function (parsedResponse) {
          console.log('parsedResponse: ', parsedResponse);
          thisApp.data.products = parsedResponse;
          thisApp.initMenu();
        });
    }, */
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      thisProduct.prepareCartProductParams();


      // console.log('new Product: ', thisProduct);
    }

    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }

    renderInMenu() {
      const thisProduct = this;
      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() {
      const thisProduct = this;
      /* find the clickable trigger (the element that should react to clicking) */
      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        /* prevent default action for event */
        event.preventDefault();
        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(select.all.menuProductsActive);
        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if ((activeProduct != thisProduct.element) && (activeProduct == 'active')) {
          activeProduct.remove(classNames.menuProduct.wrapperActive);
        }
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm() {
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });

      // console.log('initOrderForm: ', thisProduct);
    }

    processOrder() {
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      // console.log('formData', formData);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        // console.log(paramId, param);

        // for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          if (formData[paramId] && formData[paramId].includes(optionId)) {
            if (!option.default) {
              price += option.price;
            }
          } else {
            if (option.default) {
              price -= option.price;
            }
          }

          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
          // console.log(optionImage);
          if (optionImage) {
            if (formData[paramId] && formData[paramId].includes(optionId)) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
          // console.log(optionId, option);
        }
      }
      /* multiply price by amount */
      price *= thisProduct.amountWidget.value;
      // single price for productSummary
      thisProduct.priceSingle = price;
      // update calculated price in the HTML
      thisProduct.priceElem.innerHTML = price;
    }

    addToCart() {
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());

    }

    prepareCartProduct() {
      const thisProduct = this;
      const productSummary = {};

      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = thisProduct.data.price;
      productSummary.params = thisProduct.prepareCartProductParams();

      return productSummary;
    }

    prepareCartProductParams() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};

      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options: {}
        };

        for (let optionId in param.options) {
          const option = param.options[optionId];

          if (formData[paramId] && formData[paramId].includes(optionId)) {
            params[paramId].options[optionId] = option.label;
            // console.log('option.label: ', option.label);
            // console.log('params[paramId].options: ', params[paramId].options);
          }
        }
      }
      return params;
    }

  }

  app.init();
}
