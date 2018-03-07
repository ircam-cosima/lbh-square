import State from './State';

class StateEnd extends State {
  constructor(experiment){
    super(experiment, experiment.numberOfStates);
    // specific title / instruction for end screen
    this.title = 'SQUARE';
    this.instructions = '';
  }

  start() {
    // notify server
    const syncTime = this.e.sync.getSyncTime();
    this.e.send('osc', [client.index, this.id, 0, syncTime]);
    // set state view
    this.e.displayManager.title = this.title;
    this.e.displayManager.instructions = this.instructions;
    // setup motionInput
    this.setupMotionInput(true);
    // setup audio stream
    this.audioStream.url = this.streamUrl;
    this.audioStream.loop = false;
    // setup "on end of audio stream" callback
    this.audioStream.onended = () => {}
    // start audio stream
    this.audioStream.start(0);
    // setup callback
    setTimeout(() => {
      // credits
      this.e.displayManager.instructions = `
        Concept et Création: Lorenzo Bianchi Hoesch <br> <br>
        Développement: David Poirier-Quinot <br>
        Voix principale: Deborah Lopatin <br>
        Violon: Szuhwa Wu <br>
        Trompette et voix: Amir el Saffar <br>
        Water Games: West Gaua
      `;

      setTimeout(() => {
        // touch callback to restart experiment
        this.setupTouchSurface();
        this.e.displayManager.footer = "toucher l'écran pour accéder à la page du projet";
      }, this.timeBeforeNewImageClickable * 1000);

    }, this.timeBeforeNewImageDisplayed * 1000);
  }

  touchCallback(id, normX, normY){
    // play touch notification sound
    // this.e.audioPlayerTouch.start(this.id,0,0);
    // stop stream
    this.audioStream.stop(0);
    // redirect to project webpage
    window.location = "http://forumnet.ircam.fr/event/square-installation-interactive-lorenzo-bianchi-hoesch/";
  }
}

export default StateEnd;
