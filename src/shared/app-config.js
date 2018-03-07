const config = {

  common: {
    txt: {
      restartStr: 'Recommencer du début',
      continueStr: 'Reprendre la lecture',
    },
    fallbackStream: {
      id: '14-streaming-loop-infinite',
      file: 'streams/14-streaming-loop-infinite.wav',
      sync: false,
      loop: true,
    },
  },

  states: [
    // state 0
    {
      title: 'intro',

      stream: {
        id: '00-streaming',
        file: 'streams/00-streaming.wav',
        sync: false,
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'background-color',
          placeholder: 'background-color',
          color: '#454545',
        },
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 0.1,
        },
        {
          time: 1.7, // 0.01
          type: 'text',
          placeholder: 'center',
          classes: ['white', 'align-center'],
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
          type: 'text',
          placeholder: 'center',
          classes: ['white', 'align-center'],
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
          type: 'text',
          placeholder: 'center',
          classes: ['white', 'align-center'],
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
          type: 'text',
          placeholder: 'center',
          classes: ['white', 'align-center'],
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
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 52.6,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/0.jpg',
        },
        {
          time: 56.6,
          type: 'text',
          placeholder: 'top',
          classes: ['black'],
          content: `The first photo just showed up. A viewpoint so ordinary, declining.`
        },
        {
          time: 66.6,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte`
        },
        {
          time: 66.6,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-0',
            file: 'sounds/touch/01-click-image.mp3',
          }
        },
      ]
    },

    // state 1
    {
      title: 'Here is...',

      stream: {
        id: '01-streaming',
        file: 'streams/01-streaming.wav',
        sync: false,
        loop: false,
      },
      // list of events
      events: [
        {
          time: 0,
          type: 'fade-in',
          placeholder: 'background-color',
          duration: 1,
        },
        {
          time: 2, // 0.01
          type: 'text',
          placeholder: 'center',
          classes: ['white', 'align-center'],
          content: `Here is where I grew up, me, my kids, my nephews...`,
        },
        {
          time: 59,
          type: 'text',
          placeholder: 'center',
          content: '',
        },
        {
          time: 59,
          type: 'fade-out',
          placeholder: 'background-color',
          duration: 2,
        },
        {
          time: 59,
          type: 'background-image',
          placeholder: 'background-image',
          url: './images/1.jpg',
        },
        {
          time: 63.5,
          type: 'text',
          placeholder: 'top',
          classes: ['black'],
          content: `Another photo, an animal`,
        },
        {
          time: 66,
          type: 'text',
          placeholder: 'bottom',
          classes: ['banner'],
          content: `toucher l'écran une fois la position atteinte`
        },
        {
          time: 66,
          type: 'trigger-next-state',
          placeholder: 'screen',
          triggerAudio: {
            id: 'touch-1',
            file: 'sounds/touch/02-click-image.mp3',
          }
        },
      ]
    },
  ],

};

export default config;
