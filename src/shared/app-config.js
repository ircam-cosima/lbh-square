const config = {

  environment: {
    // forward informations to max patch
    // set to false if no external max patch
    osc: false,
    // hack to keep devices awake
    // `true` for creations, `false` for production
    // update home instructions accordingly
    wakeLock: true,
  },

  txt: {
    home: {
      title: 'SQUARE#2',
      subtitle: 'by Lorenzo Bianchi Hoesch',
      useHeadphones: 'Expérience à faire au casque<br />Use headphones',

      instructionsHeader: 'Merci de (Please):',
      instructions: {
        wakeLock: 'désactiver la mise en veille<br />disable sleep mode',
        // headphones: 'brancher vos écouteurs',
        // volume: 'ajuster le volume',
      },
      touchToStart: 'Toucher l\'écran pour commencer<br />Touch the screen to start',
    },
    restartPage: {
      restart: 'Recommencer du début <br> (Start from beginning)',
      continue: 'Reprendre la lecture <br> (Resume playback)',
    },
  },

  common: {
    fallbackStream: {
      id: '13-streaming-loop-infinite',
      file: 'streams/13-streaming-loop-infinite.wav',
      loop: true,
    },
    enableSubtitles: true
  },

  states: [
    // ----------------------------------------------------------------------
    // INTRO
    // ----------------------------------------------------------------------
    {
      title: 'Intro',

      stream: {
        id: '00-discours-deborah-DEF',
        file: 'streams/00-discours-deborah-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 0,
        },
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 0.1,
        },
        {
          time: 1.7, // 0.01
          type: 'text-subtitle',
          placeholder: 'center',
          // classes: ['color-red'],
          content: `
            Mon histoire est vite racontée. Je suis née en Novembre 2331, ici à
            Paris. Fille de parents anglais venus en France à la recherche d’une fortune
            meilleure après la grande crise d’Angleterre,
            <br /><br />
            My story is short to tell. I was born in November 2331, here in Paris.
            Daughter of English parents who came in France looking for a better
            everyday fleeing the great depression,
          `,
        },
        {
          time: 16.8, // 17
          type: 'text-subtitle',
          placeholder: 'center',
          // classes: ['white', 'align-center'],
          content: `
            c’est maintenant mon tour de
            partir, de tout laisser, pour chercher une alternative à ce lieu sans espoir.
            Voilà les derniers souvenirs que j'ai d'ici.
            <br /><br />
            it's now my turn to go away and leave everything to seek an alternative
            to this hopeless place. These are the last memories I have from here.
          `,
        },
        {
          time: 26.8, // 27
          type: 'text-subtitle',
          placeholder: 'center',
          // classes: ['white', 'align-center'],
          content: `
            De simples photos.
            Pour suivre le fil rouge de mes souvenirs, tu devras me suivre, et littéralement
            te mettre à l'endroit d'où j'ai pris ces photos.
            <br /><br />
            A few pictures.
            To follow the thread of my memories, you'll have to follow me and literally adopt
            the viewpoint I had when I took these pictures.
          `,
        },
        {
          time: 38,
          type: 'text-subtitle',
          placeholder: 'center',
          // classes: ['white', 'align-center'],
          content: `
            Seulement une fois que tu auras trouvé le même point de vue de l’image,
            tu devras cliquer sur l’image et suivre mon parcours.
            <br /><br />
            Only once you've reach its viewpoint will you click on an image and
            follow my journey. ` ,
        },
        {
          time: 48.2,
          type: 'text-subtitle',
          placeholder: 'center',
          // classes: ['white', 'align-center'],
          content: `Une image après
            l’autre, mon histoire.
            <br /><br />
            One image after the next, my story.`,
        },

        {
          time: 52.6,
          type: 'text',
          placeholder: 'center',
          content: '',
        },
        {
          time: 52.6,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/00.jpg',
        },
        {
          time: 52.6,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 56.6,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `The first photo just showed up.`
        },
        {
          time: 60,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: ``
        },
        {
          time: 60,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 60,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-0',
            file: 'sounds/touch/00-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 1
    // ----------------------------------------------------------------------
    {
      title: 'Discours Lorenzo',

      stream: {
        id: '01-discours-lorenzo-DEF',
        file: 'streams/01-discours-lorenzo-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 2,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
        },
        {
          time: 9,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/01.jpg',
        },
        {
          time: 11,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
        {
          time: 12,
          type: 'text',
          placeholder: 'top',
          content: ``,
        },
        {
          time: 13,
          type: 'text-subtitle',
          classes: ['gradient'],
          placeholder: 'top',
          content: `Another photo`,
        },
          {
          time: 20,
          type: 'text-subtitle',
          placeholder: 'top',
          content: `follow me! don't listen to the people around you`,
        },
        {
          time: 40,
          type: 'text-subtitle',
          placeholder: 'top',
          content: `it's the fourth corridor on the right`,
        },
        {
          time: 93,
          type: 'text-subtitle',
          placeholder: 'center',
          content: ``

        },
        {
          time: 93,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`,
        },
        {
          time: 93,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/01-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 2
    // ----------------------------------------------------------------------
    {
      title: '02-beuys-dehors',

      stream: {
        id: '02-beuys-dehors-DEF',
        file: 'streams/02-beuys-dehors-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 2,
          type: 'text',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I hesitated to get in or not, then I mustered the courage and walked in.`,
        },
        {
          time: 10,
          type: 'text-subtitle',
          placeholder: 'top',
          content: '',
        },
        {
          time: 8,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/02.jpg',
        },
        {
          time: 8,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
        {
          time: 36,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 36,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/02-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 3
    // ----------------------------------------------------------------------
    {
      title: '03-beuys-dedans',

      stream: {
        id: '03-beuys-dedans-DEF',
        file: 'streams/03-beuys-dedans-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 1,
          type: 'text-subtitle',
          placeholder: 'top',
          content: `this is one of my dearest memories.`
        },
        {
          time: 10,
          type: 'text-subtitle',
          placeholder: 'top',
          content: ``
        },
        {
          time: 52,
          type: 'text-subtitle',
          placeholder: 'top',
          content: `put your headphones on`
        },
           {
          time: 55.7, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: `Imagination exists`,
        },
        {
          time: 60,
          type: 'text-subtitle',
          placeholder: 'top',
          content: ``
        },
        {
          time: 75,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/03.jpg',
        },
        {
          time: 78,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
        {
          time: 86,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I came out through the same door I went in, doubting about everything`
        },
        {
          time: 100,
          type: 'text-subtitle',
          placeholder: 'top',
          content: ``
        },
        {
          time: 105,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `there's another object i would like to show you, we’ll go in to the next room`
        },
        {
          time: 140,
          type: 'text-subtitle',
          placeholder: 'top',
          content: ``
        },
        {
          time: 141,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 141,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/03-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 4
    // ----------------------------------------------------------------------
    {
      title: '04-nauman-dehors',

      stream: {
        id: '04-Nauman-dehors-DEF',
        file: 'streams/04-Nauman-dehors-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 3,
          type: 'text',
          placeholder: 'top',
          content: `when i say go, we enter, and i suggest you put a hand on the wall as you go down the corridor`,
        },
        {
          time: 19.2,
          type: 'text',
          placeholder: 'top', 
          content: '',
        },
        {
          time: 32,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/04.jpg',
        },
        {
          time: 35,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
        {
          time: 40,
          type: 'text',
          placeholder: 'top', 
          content: 'here\'something i would like to forget',
        },
        {
          time: 40,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 40,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/04-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 5
    // ----------------------------------------------------------------------
    {
      title: '05-nauman-dedans',

      stream: {
        id: '05-Nauman-dedans-DEF',
        file: 'streams/05-Nauman-dedans-DEF.wav',
        loop: false,
        period: 2.76,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 3,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
        },
        {
          time: 26,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 75,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/05.jpg',
        },
        {
          time: 75,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
        {
          time: 86,
          type: 'text',
          placeholder: 'top',
          classes: ['gradient'],
          content: `Keep following me, there's a thing that you must see.
          let's go to the window, we are going to put our hand on the glass`,
        },
        {
          time: 154,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 154,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 154,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/05-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 6
    // ----------------------------------------------------------------------
    {
      title: '06-fenetre',

      stream: {
        id: '06-fenetre-DEF',
        file: 'streams/06-fenetre-DEF.wav',
        loop: false,
        period: 2.76,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 2, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `It's here, taking this picture, that I made up my mind to leave.`,
        },
        {
          time: 7, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I used to live here, in the little courtyard that you can see down on the left. My home`,
        },
        {
          time: 14, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: `I used to come here, and, watching my house from here, i used to put my hands on the cold glass`,
        },
        {
          time: 20, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: `try`,
        },
        {
          time: 21, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: `3`,
        },
        {
          time: 22, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: `2`,
        },
        {
          time: 23, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: `1`,
        },
        {
          time: 24, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: `go`,
        },
        {
          time: 27, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: ``,
        },
        {
          time: 42.6, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: `I closed my eyes to get used not to see this place anymore.<br /><br />I'm blind.`,
        },
        {
          time: 50, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          content: ``,
        },
        {
          time: 100,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/06.jpg',
        },
        {
          time: 100,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
          {
          time: 100,
          type: 'vibrate',
          pattern: [500, 500, 500, 500, 500, 500], // in ms
        },
        {
          time: 104,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 104,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/06-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 7
    // ----------------------------------------------------------------------
    {
      title: `07-telephone`,

      stream: {
        id: '07-telephone-DEF',
        file: 'streams/07-telephone-DEF.wav',
        loop: false,
        period: 2.76,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 2.7,
          type: 'text',
          placeholder: 'top',
          content: `Allo? Hi it's me, is it true what they say, you're leaving?<br />
            Yeah, I'm heading south, looking for a job`,
        },
        {
          time: 11,
          type: 'text',
          placeholder: 'top',
          content: `Heading to Marseille?<br />
            Yeah, and then further south.`,
        },
        {
          time: 15.1,
          type: 'text',
          placeholder: 'top',
          content: `You want to cross the sea and go to Bechar?<br />
            Yeah, and then further south.<br />
            You go to Beni Abbes?`,
        },
          {
          time: 23,
          type: 'text',
          placeholder: 'top',
          content: `you go to El Cairo?'`
        },
        {
          time: 25,
          type: 'text', 
          placeholder: 'top',
          content: ``,
        },
        {
          time: 26,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I opened my eyes, and almost running i walked towards home.`,
        },
        {
          time: 30,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: ``,
        },
        {
          time: 30,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/07.jpg',
        },
        {
          time: 30,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
        {
          time: 66,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `L’ironie consiste en avoir continué à appeler le 3eme monde ainsi,
          même si maintenant est troisième car le plus évolué, tandis que notre premier est
          resté premier et primordial.
          <br /><br />,
           The irony is that we kept calling the 3rd world like that even if now is third 
           because is the most evolved, while our first world remanied first and primitive.`
         },
         {
          time: 100,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: ``
        },
        {
          time: 150.6,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 150.6,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/07-click-image.mp3',
          }
        },
      ]
    },


    // ----------------------------------------------------------------------
    // STATE 8
    // ----------------------------------------------------------------------
    {
      title: `08-escalier`,

      stream: {
        id: '08-escalier-DEF',
        file: 'streams/08-escalier-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 4,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/08.jpg',
        },
        {
          time: 4,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 3,
        },
        {
          time: 6.8,
          type: 'text',
          placeholder: 'top',
           classes: ['gradient'],
          content: `we go up the stairs`,
        },
        {
          time: 11.6,
          type: 'text',
          placeholder: 'top',
          content: ``,
        },
        {
          time: 11.7,
          type: 'text',
          placeholder: 'top',
           classes: ['gradient'],
          content: `Mon père me disait tout le temps: il n'y a aucune synagogue, église, communauté ethnique, qui ne merite pas d'etre abandonée.
          <br /><br />
          My father always told me: There is no synagogue, church, ethnic community, that does not deserve to be abandonned`,
        },
        {
          time: 28,
          type: 'text',
          placeholder: 'top',
          content: ``,
        },

        {
          time: 70,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 70,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/08-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 9
    // ----------------------------------------------------------------------
    {
      title: '09-escalier-Hall',

      stream: {
        id: '09-escalier-Hall-DEF',
        file: 'streams/09-escalier-Hall-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 2,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/09.jpg',
        },
        {
          time: 2,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
        {
          time: 2,
          type: 'text',
          placeholder: 'top',
          classes: ['gradient'],
          content: `we go to the terrace`,
        },
        {
          time: 14,
          type: 'text',
          placeholder: 'top',
          content: ``,
        },
        {
          time: 14,
          type: 'text',
          placeholder: 'top',
          classes: ['gradient'],
          content: `Too much noise,<br>
            too many people.`,
        },
        {
          time: 21,
          type: 'text',
          placeholder: 'top',
          content: ``,
        },
        {
          time: 18,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 18,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/09-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 10
    // ----------------------------------------------------------------------
    {
      title: '10-porte',

      stream: {
        id: '10-porte-DEF',
        file: 'streams/10-porte-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 3,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/10.jpg',
        },
        {
          time: 3,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
        {
          time: 3.6,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `it's here, let's go out and watch `
        },
        {
          time: 10,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `
            Before leaving, I told myself that I had to take a moment to sit 
            and give this place a proper goobye.`,
        },
        {
          time: 18.5, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `
            I think I read something about the couple who created this fountain, more than 3 centuries ago. (you are wrong, it is not this fountain)`,
        },
        {
          time: 26.8, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `
            I remember this sentence that the lady who made these sculptures, once full of colors and their feet in water, wrote.
            <br> <br>`,
        },
        {
          time: 33.7, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `
            "I am blind, my sculptures are my eyes, imagination is the rainbow, happyness is the imagination, imagination exists."`,
        },
        {
          time: 43, // 0.01
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: ``,
        },
        {
          time: 45,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 45,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/10-click-image.mp3',
          }
        },
      ]
    },


    // ----------------------------------------------------------------------
    // STATE 11
    // ----------------------------------------------------------------------
    {
      title: '11-vue',

      stream: {
        id: '11-vue-DEF',
        file: 'streams/11-vue-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 70,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/11.jpg',
        },
        {
          time: 70,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 5,
        },
        {
          time: 86,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I turned around,`,
        },
        {
          time: 88.7,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I walked two or three steps to breathe more easily. I looked up towards this part of the sky that is my own.`,
        },
        {
          time: 93.7,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I looked up towards this part of the sky`,
        },
        {
          time: 97.3,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `that is my own.`,
        },
          {
          time: 103,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: ``,
        },
        {
          time: 103.2,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 103.2,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/11-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 12 - ciel
    // ----------------------------------------------------------------------

      {
      title: '12-ciel',

      stream: {
        id: '12-ciel-DEF',
        file: 'streams/12-ciel-DEF.wav',
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#272727',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 1.2,
          type: 'text',
          placeholder: 'top',
          classes: ['large', 'bold'],
          content: `SQUARE #2`,
        },
        {
          time: 10.5,
          type: 'text',
          placeholder: 'center',
          classes: ['white', 'align-center'],
          content: `
            <dl>
              <dt class="first">Concept et Création :</dt>
              <dd class="first">Lorenzo Bianchi Hoesch</dd>

              <dt>Développement :</dt>
              <dd>
                David Poirier-Quinot<br />
                Benjamin Matuszewski
              </dd>

              <dt>Voix principale :</dt>
              <dd>Deborah Lopatin</dd>

              <dt>Violon :</dt>
              <dd>Szuhwa Wu</dd>

              <dt>Trompette et voix :</dt>
              <dd>Amir el Saffar</dd>

            </dl>
          `,
        },
        {
          time: 20.5,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `<a href="http://forumnet.ircam.fr/event/square-installation-interactive-lorenzo-bianchi-hoesch/">Plus d'informations</a>`,
        },
      ]
    },
  ],

};

export default config;
