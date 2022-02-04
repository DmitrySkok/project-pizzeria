import {templates, classNames, select} from '../settings.js';
import '../../vendor/flickity.pkgd.min.js';

class Home {
  constructor(element) {
    const thisHome = this;
    thisHome.render(element);
    thisHome.getElements();
    thisHome.initWidgets();
    thisHome.initLinks();
  }

  render(element) {
    const thisHome = this;
    const homePage = templates.homePage();
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = homePage;
  }

  getElements() {
    const thisHome = this;
    thisHome.dom.homeLinks = document.querySelectorAll(select.nav.homeLinks);
    thisHome.dom.pages = document.querySelector(select.containerOf.pages).children;
    thisHome.dom.navLinks = document.querySelectorAll(select.nav.links);
  }

  initWidgets() {
    const thisHome = this;
    var elem = document.querySelector('.main-carousel');
    // eslint-disable-next-line no-undef
    thisHome.flkty = new Flickity(elem, {
      autoPlay: true,
      fade: true,
      prevNextButtons: false,
    });
  }

  initLinks() {
    const thisHome = this;
    for (let link of thisHome.dom.homeLinks) {
      link.addEventListener('click', function (event) {
        const clickedElement = this;
        event.preventDefault();
        let id = clickedElement.getAttribute('href').replace('#', '');
        thisHome.activatePage(id);
        window.location.hash = '#/' + id;
      });
    }
  }

  activatePage(pageId) {
    const thisHome = this;
    for (let page of thisHome.dom.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    for (let link of thisHome.dom.navLinks) {
      link.classList.toggle(classNames.nav.active, link.getAttribute('href') == '#' + pageId);
    }
  }

}

export default Home;