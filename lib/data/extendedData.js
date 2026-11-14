// Current affairs and descriptive prompt datasets for competitive exams

export const initialCurrentAffairs = [
  {
    id: 'ca-01',
    category: 'National & Governance',
    title: 'India launches National Mission on Advanced Carbon Materials',
    date: '2026-11-05',
    summary: 'The Government of India has approved the National Mission on Advanced Carbon Materials to foster indigenous manufacturing of graphene, carbon fibers, and composites for aerospace, defence, and electric mobility.',
    question: {
      questionText: 'The National Mission on Advanced Carbon Materials primarily aims to foster indigenous capabilities in which critical strategic sector?',
      options: [
        { id: 'A', text: 'Graphene, carbon fibers, and aerospace composites' },
        { id: 'B', text: 'Single-use plastic substitutes' },
        { id: 'C', text: 'Coal gasification thermal plants' },
        { id: 'D', text: 'Rare earth mineral refining exclusively' }
      ],
      correctAnswer: 'A',
      explanation: 'The mission targets advanced material synthesis including graphene and high-grade carbon fibers for defense, aerospace, and energy storage.'
    }
  },
  {
    id: 'ca-02',
    category: 'Economy & Banking',
    title: 'RBI introduces enhanced Central Bank Digital Currency (e-Rupee) cross-border protocol',
    date: '2026-11-06',
    summary: 'Reserve Bank of India has initiated bilateral pilot frameworks for settlement of international merchandise trade using Digital Rupee (CBDC) to reduce foreign exchange transaction friction.',
    question: {
      questionText: 'Under the bilateral CBDC framework by the RBI, what is the primary benefit intended for cross-border trade settlements?',
      options: [
        { id: 'A', text: 'Reduction of settlement time and elimination of intermediary conversion fees' },
        { id: 'B', text: 'Mandatory replacement of all international letters of credit' },
        { id: 'C', text: 'Guaranteed fixed interest returns on digital currency reserves' },
        { id: 'D', text: 'Automatic exemption from customs tariff obligations' }
      ],
      correctAnswer: 'A',
      explanation: 'CBDC cross-border mechanisms allow direct real-time sovereign digital ledger settlements, minimizing correspondent banking delays and forex markups.'
    }
  },
  {
    id: 'ca-03',
    category: 'Science & Environment',
    title: 'ISRO inaugurates Next-Generation Earth Observation Data Portal',
    date: '2026-11-07',
    summary: 'ISRO has integrated high-resolution SAR and multispectral imagery from recent satellite missions into a single open-access portal for agricultural monitoring, disaster management, and urban planning.',
    question: {
      questionText: 'Synthetic Aperture Radar (SAR) imagery provided by ISRO sensors is uniquely advantageous over optical sensors because:',
      options: [
        { id: 'A', text: 'It can penetrate cloud cover and operate equally well day and night' },
        { id: 'B', text: 'It does not require any satellite orbit maintenance' },
        { id: 'C', text: 'It operates strictly in the visible optical spectrum' },
        { id: 'D', text: 'It requires zero ground receiving station calibration' }
      ],
      correctAnswer: 'A',
      explanation: 'Microwave radar signals penetrate clouds, atmospheric haze, and darkness, enabling 24/7 all-weather surface observation.'
    }
  }
];

export const initialDescriptivePrompts = [
  {
    id: 'desc-01',
    exam: 'SSC CGL / Tier 2 & SBI PO',
    topicType: 'Essay',
    title: 'The Role of Digital Public Infrastructure in India\'s Economic Inclusivity',
    wordLimit: '250 - 300 words',
    instructions: 'Discuss the impact of UPI, Aadhaar, and DigiLocker on formal financial inclusion and governance efficiency.',
    rubric: {
      contentRelevance: 30,
      structureAndCoherence: 25,
      grammaticalAccuracy: 25,
      vocabularyAndVocabularyPrecision: 20
    }
  },
  {
    id: 'desc-02',
    exam: 'IBPS PO / SBI PO',
    topicType: 'Formal Letter',
    title: 'Letter to the Branch Manager Requesting Enhanced Credit Facility for a Micro Enterprise',
    wordLimit: '150 words',
    instructions: 'Draft a formal letter outlining your enterprise track record, expansion requirements, and proposed collateral.',
    rubric: {
      formalFormatAndSalutation: 25,
      clarityOfSubjectMatter: 35,
      toneAndCourtesy: 20,
      grammaticalPrecision: 20
    }
  }
];

