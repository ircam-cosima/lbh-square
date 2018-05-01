const config = {

  environment: {
    // forward informations to max patch
    // set to false if no external max patch
    osc: true,
    // hack to keep devices awake
    // `true` for creations, `false` for production
    // update home instructions accordingly
    wakeLock: true,
  },

  txt: {
    home: {
      title: 'SQUARE',
      subtitle: 'by Lorenzo Bianchi Hoesh',
      useHeadphones: 'EXPÉRIENCE À FAIRE AU CASQUE <br> (USE HEADPHONES)',

      instructionsHeader: 'Merci de (Please):',
      instructions: {
        wakeLock: 'désactiver la mise en veille <br> (disable sleep mode)',
        // headphones: 'brancher vos écouteurs',
        // volume: 'ajuster le volume',
      },
      touchToStart: 'Toucher l\'écran pour commencer <br> (Touch the screen to start)',
    },
    restartPage: {
      restart: 'Recommencer du début <br> (Start from beginning)',
      continue: 'Reprendre la lecture <br> (Resume playback)',
    },
  },

  common: {
    fallbackStream: {
      id: '14-streaming-loop-infinite',
      file: 'streams/14-streaming-loop-infinite.wav',
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
        id: '00-streaming',
        file: 'streams/00-streaming.wav',
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
            De simples photos, des points de vue sur ce square qui m’est si cher. Pour
            suivre le fil rouge de mes souvenirs, tu devras me suivre, et littéralement
            te mettre à l'endroit d'où j'ai pris ces photos.
            <br /><br />
            A few pictures, viewpoints on this Square so dear to me. To follow
            the thread of my memories, you'll have to follow me and literally adopt
            the viewpoint I had when I took these pictures.
          `,
        },
        {
          time: 41,
          type: 'text-subtitle',
          placeholder: 'center',
          // classes: ['white', 'align-center'],
          content: `
            Seulement une fois que tu auras trouvé le même point de vue de l’image,
            tu devras cliquer sur l’image et suivre mon parcours. Une image après
            l’autre, mon histoire.
            <br /><br />
            Only once you've reach its viewpoint will you click on an image and
            follow my journey. One image after the next, my story.
          `,
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
          content: `The first photo just showed up. A viewpoint so ordinary, declining.`
        },
        {
          time: 66.6,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 66.6,
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
      title: 'Where I grew',

      stream: {
        id: '01-streaming',
        file: 'streams/01-streaming.wav',
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
          time: 2, // 0.01
          type: 'text-subtitle',
          placeholder: 'center',
          content: `Here is where I grew up, me, my kids, my nephews...`,
        },
        {
          time: 6,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
        },
        {
          time: 59,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 59,
          type: 'text-subtitle',
          placeholder: 'center',
          content: '',
        },
        {
          time: 59,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/01.jpg',
        },
        {
          time: 59,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 63.5,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `Another photo, an animal`,
        },
        {
          time: 66,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 66,
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
      title: 'The fountain',

      stream: {
        id: '02-streaming',
        file: 'streams/02-streaming.wav',
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
          time: 3.5, // 0.01
          type: 'text-subtitle',
          placeholder: 'center',
          content: `
            I think I read something about the couple who created this fountain, more than 3 centuries ago.
            I remember this sentence that the lady who made these sculptures, once full of colors and their feet in water, wrote.
            <br> <br>
            "I am blind, my sculptures are my eyes, imagination is the rainbow, hapyness is the imagination, imagination exists."
          `,
        },
        {
          time: 30,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
        },
        {
          time: 80,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 80,
          type: 'text-subtitle',
          placeholder: 'center',
          content: '',
        },
        {
          time: 80,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/02.jpg',
        },
        {
          time: 80,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 86,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I then turned around and took a few pictures to bring with me.`,
        },
        {
          time: 91,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 91,
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
      title: 'Heading to Marseille',

      stream: {
        id: '03-streaming',
        file: 'streams/03-streaming.wav',
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
          content: `Écoute (Listen)`,
        },
        {
          time: 19.2,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 19.2,
          type: 'text',
          placeholder: 'center',
          content: '',
        },
        {
          time: 19.2,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/03.jpg',
        },
        {
          time: 19.2,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 21.2,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 21.2,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/03-click-image.mp3',
          }
        },
        {
          time: 22.7,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `You're heading to Marseille?`,
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 4
    // ----------------------------------------------------------------------
    {
      title: 'My memories were',

      stream: {
        id: '04-streaming',
        file: 'streams/04-streaming.wav',
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
          content: `Écoute (Listen)`,
        },
        {
          time: 16.5,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 16.5,
          type: 'text',
          placeholder: 'center',
          content: '',
        },
        {
          time: 16.5,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/04.jpg',
        },
        {
          time: 16.5,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 16.6,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `My memories were grim`,
        },
        {
          time: 16.6,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 18.6,
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
      title: 'Then I continued',

      stream: {
        id: '05-streaming',
        file: 'streams/05-streaming.wav',
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
          time: 26,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/05.jpg',
        },
        {
          time: 26,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 30,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `Then I continued, to the end of the square, towards the church.`,
        },
        {
          time: 46,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 46,
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
      title: 'There is no...',

      stream: {
        id: '06-streaming',
        file: 'streams/06-streaming.wav',
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
          time: 2.5, // 0.01
          type: 'text-subtitle',
          placeholder: 'center',
          content: `There is no synagogue, church, polis, ethnic community, that does not deserve to be abandonned.`,
        },
        {
          time: 13,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
        },
        {
          time: 40.5,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 40.5, // 0.01
          type: 'text',
          placeholder: 'center',
          content: ``,
        },
        {
          time: 40.5,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/06.jpg',
        },
        {
          time: 40.5,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 47.1,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I hesitated to get in or not, then I mustered the courage and walked in.`,
        },

        {
          time: 65.5,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 65.5,
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
      title: `It's here`,

      stream: {
        id: '07-streaming',
        file: 'streams/07-streaming.wav',
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
          time: 6, // 0.01
          type: 'text-subtitle',
          placeholder: 'center',
          content: `It's here, taking this picture, that I made up my mind to leave.`,
        },
        {
          time: 15,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
        },
        {
          time: 317,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 317, // 0.01
          type: 'text',
          placeholder: 'center',
          content: ``,
        },
        {
          time: 317,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/07.jpg',
        },
        {
          time: 317,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 320.5,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I came out through the same door I went in, slowly. I sat down on the steps, amongst other people.`,
        },

        {
          time: 337,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 337,
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
      title: `I closed my eyes`,

      stream: {
        id: '08-streaming',
        file: 'streams/08-streaming.wav',
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
          time: 1, // 0.01
          type: 'text-subtitle',
          placeholder: 'center',
          content: `I closed my eyes to get used not to see this place anymore.<br /><br />I'm blind.`,
        },
        {
          time: 12,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
        },
        {
          time: 112,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 112, // 0.01
          type: 'text',
          placeholder: 'center',
          content: ``,
        },
        {
          time: 112,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/08.jpg',
        },
        {
          time: 112,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 112,
          type: 'vibrate',
          pattern: [500, 500, 500, 500, 500, 500], // in ms
        },
        {
          time: 115,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 115,
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
      title: 'Phone call',

      stream: {
        id: '09-streaming',
        file: 'streams/09-streaming.wav',
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
          time: 2, // 0.01
          type: 'text-subtitle',
          placeholder: 'center',
          content: `
            Allo? Hi it's me, is it true what they say, you're leaving?<br />
            Yeah, I'm heading south, looking for a job.<br />
            Heading to Marseille?<br />
            Yeah, and then further south.<br />
            You want to cross the sea and go to Bechar?<br />
            Yeah, and then further south.<br />
            You go to Beni Abbes?`,
        },
        {
          time: 25,
          type: 'text',
          placeholder: 'center',
          content: '',
        },
        {
          time: 25,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/09.jpg',
        },
        {
          time: 25,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 28,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I opened my eyes, stood up, and heading to my right walked towards home.`,
        },
        {
          time: 37,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
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
            file: 'sounds/touch/09-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 10
    // ----------------------------------------------------------------------
    {
      title: 'The café',

      stream: {
        id: '10-streaming',
        file: 'streams/10-streaming.wav',
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
          content: `Écoute (Listen)`,
        },
        {
          time: 98,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 98,
          type: 'text',
          placeholder: 'center',
          content: '',
        },
        {
          time: 98,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/10.jpg',
        },
        {
          time: 98,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 104.6,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `
            Before leaving, I told myself that I had to take a moment to sit and give this place a proper goobye. I searched for a café around me.`,
        },
        {
          time: 116,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 116,
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
      title: 'Phone call',

      stream: {
        id: '11-streaming',
        file: 'streams/11-streaming.wav',
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
          time: 3, // 0.01
          type: 'text-subtitle',
          placeholder: 'center',
          content: `Imagination exists`,
        },
        {
          time: 8.2,
          type: 'text',
          placeholder: 'center',
          content: '',
        },
        {
          time: 8.2,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/11.jpg',
        },
        {
          time: 8.2,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 11.4,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `Slowly, I arrived to the last café of the square.`,
        },
        {
          time: 19,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
        },
        {
          time: 68.2,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 68.2,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 68.2,
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
    // STATE 12
    // ----------------------------------------------------------------------
    {
      title: 'Phone call',

      stream: {
        id: '12-streaming',
        file: 'streams/12-streaming.wav',
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
          time: 16, // 0.01
          type: 'text-subtitle',
          placeholder: 'center',
          content: `
            I finally did not go in there.<br><br>
            Too much noise,<br>
            too many people.
          `,
        },
        {
          time: 25,
          type: 'text',
          placeholder: 'top',
          content: `Écoute (Listen)`,
        },
        {
          time: 31.5,
          type: 'text',
          placeholder: 'top',
          content: '',
        },
        {
          time: 31.5,
          type: 'text',
          placeholder: 'center',
          content: '',
        },
        {
          time: 31.5,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/12.jpg',
        },
        {
          time: 31.5,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 42.5,
          type: 'text-subtitle',
          placeholder: 'top',
          classes: ['gradient'],
          content: `I turned around, walked two or three steps to breathe more easily. I looked up towards this part of the sky that is my own.`,
        },
        {
          time: 56.5,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte <br> (touch the screen once you reached this place)`
        },
        {
          time: 56.5,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/12-click-image.mp3',
          }
        },
      ]
    },

    // ----------------------------------------------------------------------
    // STATE 13 - END STATE
    // ----------------------------------------------------------------------
    {
      title: 'Credits',

      stream: {
        id: '13-streaming',
        file: 'streams/13-streaming.wav',
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
          content: `SQUARE`,
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

              <dt>Water Games :</dt>
              <dd>West Gaua</dd>
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
