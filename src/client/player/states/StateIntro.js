import State from './State';

class StateIntro extends State {
  constructor(experiment) {
    super(experiment, 0);

    this.sParams = {
      textTimes: [0.01, 17, 27, 41], // in sec
      // textTimes: [0.01, 1, 1, 1], // in sec

      textFr:[
        `Mon histoire est vite racontée. Je suis née en Novembre 2331, ici à
        Paris. Fille de parents anglais venus en France à la recherche d’une fortune
        meilleure après la grande crise d’Angleterre,`,
        `c’est maintenant mon tour de
        partir, de tout laisser, pour chercher une alternative à ce lieu sans espoir.
        Voilà les derniers souvenirs que j'ai d'ici.`,
        `Des simples photos, des points de vue sur ce square qui m’est si cher. Pour
        suivre le fil rouge de mes souvenirs, tu devras me suivre, et littéralement
        te mettre à l'endroit d'où j'ai pris ces photos.`,
        `Seulement une fois que tu auras trouvé le même point de vue de l’image,
        tu devras cliquer sur l’image et suivre mon parcours. Une image après
        l’autre, mon histoire.`
      ],

      textEn:[
        `My story is short to tell. I was born in November 2331, here in Paris.
        Daughter of English parents who came in France looking for a better
        everyday fleeing the great depression,`,
        `it's now my turn to go away and leave everything to seek an alternative
        to this hopeless place. These are the last memories I have from here.`,
        `A few pictures, viewpoints on this Square so dear to me. To follow
        the thread of my memories, you'll have to follow me and literally adopt
        the viewpoint I had when I took these pictures.`,
        `Only once you've reach its viewpoint will you click on an image and
        follow my journey. One image after the next, my story.`
      ],
    };
  }

  start() {
    // notify server
    this.e.send('osc', [client.index, this.id, 0, this.e.sync.getSyncTime()]);
    // setup motionInput
    this.setupMotionInput(true);
    // setup audio
    this.audioStream.url = this.streamUrl;
    this.audioStream.loop = false;
    // setup 'on end of audio stream' callback
    this.audioStream.onended = function(){
      this.url = streamLoopFileName;
      this.loop = true;
      this.start(0);
    }
    // start audio
    this.audioStream.start(0);

    // setup main text and subtitles change callbacks
    for( let i = 0; i < this.sParams.textTimes.length; i++ ){
      setTimeout( () => {
        // display text
        this.e.displayManager.instructions = this.sParams.textFr[i] + '<br> <br>' + this.sParams.textEn[i];
      }, this.sParams.textTimes[i] * 1000 );
    }

    // set callback to change stream / display image
    setTimeout(() => {
      // notify server
      this.e.send('osc', [client.index, this.id, 1]);
      // display image
      this.e.displayManager.setImg(this.image);
      this.e.displayManager.setOpaque(0, 2);

      // setup touch callback after block time
      setTimeout(() => {
        // un-hide banner
        document.getElementById('background-banner').style.display = 'block';
        // setup touch callback
        this.setupTouchSurface();
      }, this.timeBeforeNewImageClickable * 1000);


      setTimeout(() => {
        // display image subtitles
        this.e.displayManager.instructionsImgClass = this.instructionsImgClass;
        this.e.displayManager.instructionsImg = this.instructionsImg;
      }, this.timeBeforeSubtitleImgDisplayed * 1000);

    }, (this.timeBeforeNewImageDisplayed) * 1000);
  }
}

export default StateIntro;
