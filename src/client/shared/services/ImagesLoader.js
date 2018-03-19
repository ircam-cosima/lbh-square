import { Service, serviceManager } from 'soundworks/client';

const SERVICE_ID = 'service:images-loader';


class ImagesLoader extends Service {
  constructor() {
    super(SERVICE_ID, false);

    const defaults = {
      files: [],
      viewPriority: 3,
    };

    this.configure(defaults);
  }

  start() {
    super.start();
    this.show();

    this.loadImages();
  }

  stop() {
    this.hide();
    super.stop();
  }

  loadImages() {
    const images = this.options.files;

    const promises = images.map(src => {
      return new Promise((resolve, reject) => {
        const $img = new Image();
        $img.src = src;
        $img.onload = () => resolve();
      });
    });

    Promise.all(promises).then(() => this.ready());
  }
}

serviceManager.register(SERVICE_ID, ImagesLoader);

export default ImagesLoader;
