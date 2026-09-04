const STORY_DATA = {
  playerPool: [
    { name: 'Virat', country: 'India', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Rohit', country: 'India', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Bumrah', country: 'India', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
    { name: 'Dhoni', country: 'India', role: 'all', battingStyle: 'balanced', bowlingStyle: 'defensive' },
    { name: 'Hardik', country: 'India', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Jadeja', country: 'India', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Ashwin', country: 'India', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Pant', country: 'India', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Shami', country: 'India', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
    { name: 'Rahul', country: 'India', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Suryakumar', country: 'India', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Siraj', country: 'India', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'Kuldeep', country: 'India', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Axar', country: 'India', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Iyer', country: 'India', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
    { name: 'Babar', country: 'Pakistan', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
    { name: 'Shaheen', country: 'Pakistan', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
    { name: 'Rizwan', country: 'Pakistan', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Shadab', country: 'Pakistan', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Haris', country: 'Pakistan', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Fakhar', country: 'Pakistan', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
    { name: 'Naseem', country: 'Pakistan', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
    { name: 'Shan', country: 'Pakistan', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Iftikhar', country: 'Pakistan', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Usama', country: 'Pakistan', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Afridi', country: 'Pakistan', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'Smith', country: 'Australia', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Warner', country: 'Australia', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
    { name: 'Cummins', country: 'Australia', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'Starc', country: 'Australia', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
    { name: 'Hazlewood', country: 'Australia', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
    { name: 'Maxwell', country: 'Australia', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Labuschagne', country: 'Australia', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Head', country: 'Australia', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Zampa', country: 'Australia', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Marsh', country: 'Australia', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Root', country: 'England', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Stokes', country: 'England', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Bairstow', country: 'England', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Archer', country: 'England', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'Woakes', country: 'England', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Livingstone', country: 'England', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Rashid', country: 'England', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Brook', country: 'England', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Curran', country: 'England', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Wood', country: 'England', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
    { name: 'de Kock', country: 'South Africa', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Rabada', country: 'South Africa', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'Miller', country: 'South Africa', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Markram', country: 'South Africa', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Shamsi', country: 'South Africa', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Nortje', country: 'South Africa', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'van der Dussen', country: 'South Africa', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Jansen', country: 'South Africa', role: 'all', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'Klaasen', country: 'South Africa', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Williamson', country: 'New Zealand', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Boult', country: 'New Zealand', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'Conway', country: 'New Zealand', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Santner', country: 'New Zealand', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Phillips', country: 'New Zealand', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Southee', country: 'New Zealand', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
    { name: 'Latham', country: 'New Zealand', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Ferguson', country: 'New Zealand', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'Rachin', country: 'New Zealand', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Mendis', country: 'Sri Lanka', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Theekshana', country: 'Sri Lanka', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Hasaranga', country: 'Sri Lanka', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Shanaka', country: 'Sri Lanka', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Asalanka', country: 'Sri Lanka', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Karunaratne', country: 'Sri Lanka', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Chameera', country: 'Sri Lanka', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
    { name: 'Pathirana', country: 'Sri Lanka', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
    { name: 'Pollard', country: 'West Indies', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Russell', country: 'West Indies', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Holder', country: 'West Indies', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Pooran', country: 'West Indies', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
    { name: 'Mayers', country: 'West Indies', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Cottrell', country: 'West Indies', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
    { name: 'Hope', country: 'West Indies', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
    { name: 'Chase', country: 'West Indies', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
    { name: 'Alzarri', country: 'West Indies', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' }
  ],
  tiers: [
    {
      id: 'gully',
      name: { en: 'Gully Cricket', hi: 'Gully Cricket' },
      subtitle: { en: 'Where legends are born in the dust', hi: 'Jahan riwaz mitti mein janam lete hain' },
      intro: {
        en: 'You and your friends have been playing in the gully for years. But the Lane Boys think they own this area. Time to prove them wrong.',
        hi: 'Tere aur tere dost saalon se gully mein khel rahe hain. Par Lane Boys ko lagta hai ye unka area hai. Abhi inko dikhate hain.'
      },
      difficulty: 0.2,
      trophy: { name: 'Gully Champion', icon: 'bronze', medal: 'bronze' },
      matches: [
        {
          oppName: 'Lane Boys',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Ravi K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Suresh M.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Amit P.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Deepak S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Vikram R.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Manoj T.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Rajesh G.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Sunil V.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Pankaj N.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Ajay D.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Sanjay B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "These guys think they own the gully. Let\'s show them what real cricket looks like."',
              hi: 'Ravi: "Bhai ye logon ko lagta hai ye unka gully hai. Inko dikhate hain asli cricket kya hoti hai."'
            },
            win: {
              en: 'The gully erupts in cheers. The Lane Boys walk away silently. Respect earned.',
              hi: 'Gully mein chaa gayi hum! Lane Boys chup chaap chale gaye. Izzat mil gayi.'
            },
            lose: {
              en: 'Ravi: "Don\'t worry brother. We\'ll get them next time. This isn\'t over."',
              hi: 'Ravi: "Koi nahi bhai. Agli baar pakka. Abhi khatam nahi hua hai."'
            }
          },
          roasts: {
            en: [
              'Bro your batting is so bad even the stumps feel embarrassed ★★★',
              'I\'ve seen better cricket from a random kid in the park ★★★',
              'You call that batting? My grandmother swings harder ★★★',
              'Even the fielder yawned watching your innings ★★★',
              'Bro just retire, you\'re wasting everyone\'s time ★★★'
            ],
            hi: [
              'Bhai teri batting dekh ke stumps ko bhi sharam aa rahi hai ★★★',
              'Park mein khelne wala bachcha bhi tere se accha khelta hai ★★★',
              'Tu batting kar raha hai ya exercise? Dadi bhi tere se zyada maarti hai ★★★',
              'Fielder bhi teri batting dekh ke yaun aa raha hai ★★★',
              'Bhai tu retire ho ja, sabka time waste kar raha hai ★★★'
            ]
          }
        },
        {
          oppName: 'Park Strikers',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Karan J.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Nitin A.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Rohit L.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Gaurav S.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Yogesh P.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Praveen K.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Mohit R.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Tarun D.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Ashish M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Vinay T.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Neeraj C.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The Park Strikers have been bullying the new kids. We need to shut them down."',
              hi: 'Ravi: "Park Strikers naye bachchon ko dara rahe hain. Inko band karna hoga."'
            },
            win: {
              en: 'Ravi lifts you up. The park is yours now. The Strikers have nothing left to say.',
              hi: 'Ravi tujhe utha ke khada kar deta hai. Park ab tumhara hai. Strikers ke paas kuch bolne ko nahi bacha.'
            },
            lose: {
              en: 'Ravi: "They got lucky today. But luck runs out. We come back stronger."',
              hi: 'Ravi: "Aaj inki kismat acchi thi. Par kismat badalti hai. Hum aur mazboot hokar ayenge."'
            }
          },
          roasts: {
            en: [
              'That shot was so weak even the breeze could have stopped it ★★★',
              'Bro I thought you were playing cricket not hide and seek ★★★',
              'Your bowling is like a slow motion replay ★★★',
              'Even the non-striker wanted to run away ★★★',
              'You\'re the reason the stumps are laughing at you ★★★'
            ],
            hi: [
              'Wo shot itna kamzor tha ki hawa bhi rok leti ★★★',
              'Bhai laga tu cricket khel raha hai ya lukma chhupi ★★★',
              'Teri bowling dekh ke laga slow motion mein dekh raha hoon ★★★',
              'Non-striker bhi tere se bhaagna chahta tha ★★★',
              'Tu isliye hai kyunki stumps tujhpe has rahe hain ★★★'
            ]
          }
        },
        {
          oppName: 'Gully Kings',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Sameer H.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Imran Q.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Farhan Z.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Wasim B.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'aggressive' },
            { name: 'Adil N.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Tariq F.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Zubair E.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Javed I.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Salim O.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Kamran W.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Nadeem X.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The Gully Kings. They\'ve ruled this area for 3 years. Tonight, their reign ends."',
              hi: 'Ravi: "Gully Kings. Ye 3 saal se iss area pe raaj kar rahe hain. Aaj unka raaj khatam hoga."'
            },
            win: {
              en: 'The Gully Kings are dethroned. You and Ravi embrace. A new era begins in the gully.',
              hi: 'Gully Kings ka raj khatam! Tu aur Ravi gale milte ho. Gully mein nayi subah aa gayi.'
            },
            lose: {
              en: 'Ravi: "We were so close. But close isn\'t enough. We train harder."',
              hi: 'Ravi: "Itne paas aa gaye the. Par paas hona kaafi nahi hai. Aur mehnat karenge."'
            }
          },
          roasts: {
            en: [
              'The Gully Kings more like Gully Clowns after that performance ★★★',
              'Bro you swing at the ball like you\'re swatting mosquitoes ★★★',
              'Your fielding is so bad the ball feels sorry for you ★★★',
              'That was the most predictable delivery I\'ve ever seen ★★★',
              'Even the gully dogs are barking at your batting ★★★'
            ],
            hi: [
              'Gully Kings nahi ab ye Gully Jokers lag rahe hain ★★★',
              'Bhai tu ball pe itna zor se maar raha hai jaise machhar ko maar raha ho ★★★',
              'Teri fielding dekh ke ball ko tujhpe taras aa raha hai ★★★',
              'Ye sabse predictable gend thi jo maine dekhi hai ★★★',
              'Gully ke kutte bhi tere batting pe bhaunk rahe hain ★★★'
            ]
          }
        }
      ]
    },
    {
      id: 'area',
      name: { en: 'Area Tournament', hi: 'Area Tournament' },
      subtitle: { en: 'Beyond the neighborhood', hi: 'Mohalle se aage' },
      intro: {
        en: 'Word spread about your gully triumph. Now the area tournament awaits. A local politician backs you, but the competition is fierce. This is where real cricket begins.',
        hi: 'Tumhari gully jeet ki khabar fail gayi. Ab area tournament hai. Ek neta ne support kiya hai, par competition bahut tough hai. Yahan se asli cricket shuru hoti hai.'
      },
      difficulty: 0.35,
      trophy: { name: 'Area Champion', icon: 'silver', medal: 'silver' },
      matches: [
        {
          oppName: 'Sector-7 Scorpions',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Dhruv M.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Arjun S.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Vihaan P.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Reyansh K.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Aarav G.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Vivaan R.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Aditya T.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Kabir N.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Avni D.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Saanvi B.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Anika V.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Your backer: "The Scorpions sting hard. Their captain Dhruv has never lost a toss. Stay sharp."',
              hi: 'Tera supporter: "Scorpions ka kaatna khatarnak hai. Unka captain Dhruv toss nahi haarta. Savdhaan rehna."'
            },
            win: {
              en: 'The Scorpions retreat to their sector. You\'ve drawn first blood in the area tournament.',
              hi: 'Scorpions apne sector mein laut gaye. Area tournament mein pehla knockout tumhara.'
            },
            lose: {
              en: 'Your backer: "Don\'t lose hope. The Scorpions are strong but not unbeatable. Regroup."',
              hi: 'Tera supporter: "Himmat mat haaro. Scorpions strong hain par unbeatable nahi. Dobara try karo."'
            }
          },
          roasts: {
            en: [
              'Sector-7? More like Sector-0 after that batting display ★★★',
              'Bro your bowling is so slow even snails are judging you ★★★',
              'I\'ve seen better cricket from a traffic light ★★★',
              'That shot was so bad it registered on seismographs ★★★',
              'The Scorpions? More like the Snails with that run rate ★★★'
            ],
            hi: [
              'Sector-7? Ye to Sector-0 ho gaya uss batting ke baad ★★★',
              'Bhai teri bowling itni slow hai ki slow-worm bhi judge kar raha hai ★★★',
              'Traffic light se bhi accha cricket khelta hai ★★★',
              'Wo shot itna bura tha ki earthquake record ho gaya ★★★',
              'Scorpions? Bhai ye to Snails lag rahe hain uss run rate se ★★★'
            ]
          }
        },
        {
          oppName: 'Millennium Eagles',
          oppCountry: 'Australia',
          oppPlayers: [
            { name: 'Jack W.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Liam H.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Noah C.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Ethan M.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'aggressive' },
            { name: 'Mason T.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Lucas P.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Oliver R.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'James B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Ben S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Henry K.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Alexander D.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "These Eagles fly high but we\'ll clip their wings. Their bowler Oliver is dangerous."',
              hi: 'Ravi: "Ye Eagles udd to rahe hain par inke par kaat denge. Inka bowler Oliver khatarnak hai."'
            },
            win: {
              en: 'The Eagles have landed — face first. Ravi is pumped. The crowd goes wild.',
              hi: 'Eagles gir gaye! Ravi pagal ho gaya hai. Crowd pagal hai.'
            },
            lose: {
              en: 'Ravi: "The Eagles were tough. But we\'ve beaten tougher in the gully."',
              hi: 'Ravi: "Eagles the. Par gully mein humne inse bhi tough ko haraya hai."'
            }
          },
          roasts: {
            en: [
              'Millennium Eagles? More like Millennium Seagulls ★★★',
              'Bro your batting era is over before it even started ★★★',
              'I\'ve seen more exciting paint drying than your innings ★★★',
              'That bowling was so flat it could iron clothes ★★★',
              'The only eagle here is the one circling your wicket ★★★'
            ],
            hi: [
              'Millennium Eagles? Bhai ye to Millennium Seagulls lag rahe hain ★★★',
              'Bhai teri batting era shuru hone se pehle hi khatam ho gaya ★★★',
              'Teri batting se paint sookhna bhi zyada exciting hai ★★★',
              'Wo bowling itni flat thi ki kapde bhi press ho jaate ★★★',
              'Yahan pe ek hi eagle hai jo teri wicket ke upar ghoom raha hai ★★★'
            ]
          }
        },
        {
          oppName: 'Royal Rangers',
          oppCountry: 'Pakistan',
          oppPlayers: [
            { name: 'Bilal A.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Hamza F.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Daniyal R.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Hassan E.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'aggressive' },
            { name: 'Omar Z.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Zayan I.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Kashif M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Talha Q.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Saad W.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Faizan N.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Usman G.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Royal Rangers think they\'re fancy with their royal name. Let\'s humble them."',
              hi: 'Ravi: "Royal Rangers ko lagta hai ye bahut royal hain. Inko humble karte hain."'
            },
            win: {
              en: 'The Rangers are dethroned. Their royal title means nothing against your fire.',
              hi: 'Rangers ka raj khatam! Unka royal title hamari aag ke saamne kuch nahi.'
            },
            lose: {
              en: 'Ravi: "Royal Rangers played well. But next time, we play smarter."',
              hi: 'Ravi: "Royal Rangers ne accha khela. Par agli baar hum aur smart khelenge."'
            }
          },
          roasts: {
            en: [
              'Royal Rangers? More like Royal Losers with that score ★★★',
              'Bro your batting is so bad the royal family disowned you ★★★',
              'That bowling was so ordinary it should change its name ★★★',
              'I\'ve seen better cricket from a street vendor ★★★',
              'The only royal thing about you is your royal failure ★★★'
            ],
            hi: [
              'Royal Rangers? Score dekh ke ye Royal Losers lag rahe hain ★★★',
              'Bhai teri batting itni buri hai ki royal family ne disown kar diya ★★★',
              'Wo bowling itni ordinary thi ki naam badal lena chahiye ★★★',
              'Thhadi wale se bhi accha cricket khelta hai ★★★',
              'Tujhme sirf royal cheez hai teri royal fail ★★★'
            ]
          }
        },
        {
          oppName: 'Area Champions',
          oppCountry: 'Pakistan',
          oppPlayers: [
            { name: 'Yasir K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Ali B.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Umair S.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Sohail T.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'aggressive' },
            { name: 'Rameez H.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Azhar D.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Waqas M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Faisal P.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Junaid R.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Bilal G.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Kamran V.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The Area Champions. They\'ve been undefeated for 2 years. Tonight, we end that streak."',
              hi: 'Ravi: "Area Champions. Ye 2 saal se unbeatable hain. Aaj inki streak khatam karenge."'
            },
            win: {
              en: 'You\'ve done it! The Area Champions fall. Ravi is in tears. You are the new area champions.',
              hi: 'Kar diya! Area Champions gir gaye. Ravi ke aansu nikal aaye. Tum naye Area Champion ho.'
            },
            lose: {
              en: 'Ravi: "So close. But we\'re not done. This is just the beginning."',
              hi: 'Ravi: "Itna paas! Par abhi khatam nahi hua. Ye to bas shuruaat hai."'
            }
          },
          roasts: {
            en: [
              'Area Champions? Not anymore after that performance ★★★',
              'Bro your batting champion status has been revoked ★★★',
              'That was the most overrated innings I\'ve ever witnessed ★★★',
              'The champions look more like chumps today ★★★',
              'Your reign is over, welcome to the relegation zone ★★★'
            ],
            hi: [
              'Area Champions? Ab nahi rahe uss performance ke baad ★★★',
              'Bhai tera champion title cancel ho gaya hai ★★★',
              'Ye sabse overrated innings thi jo maine dekhi hai ★★★',
              'Champions nahi aaj chumps lag rahe hain ★★★',
              'Tera raaj khatam, ab relegation zone mein swagat hai ★★★'
            ]
          }
        }
      ]
    },
    {
      id: 'village',
      name: { en: 'Inter-Village Challenge', hi: 'Gaon vs Gaon' },
      subtitle: { en: 'Villages collide', hi: 'Gaon takra rahe hain' },
      intro: {
        en: 'Your area victory caught the attention of village cricket councils. Now villages compete for honor. A mysterious team from the desert awaits, and a former state coach watches from the stands.',
        hi: 'Tumhari area jeet ne gaon cricket council ka dhyaan khincha. Ab gaon apni izzat ke liye lad rahe hain. Ret se ek mysterious team aayi hai, aur ek purane state coach stand mein dekh raha hai.'
      },
      difficulty: 0.45,
      trophy: { name: 'Village Conqueror', icon: 'gold', medal: 'gold' },
      matches: [
        {
          oppName: 'Village Warriors',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Prakash Y.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Dinesh V.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Ramesh N.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Surender G.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Mahesh K.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Lakha P.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Bhola T.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Kalu S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Mangal D.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Ramdeo R.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Sher Singh', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Village Warriors are tough. They play with raw passion. Let\'s match their energy."',
              hi: 'Ravi: "Village Warriors bahut tough hain. Ye junoon se khelte hain. Hum bhi unka junoon dikhayenge."'
            },
            win: {
              en: 'The village falls silent. Your team stands tall. The Warriors bow to your skill.',
              hi: 'Gaon khamosh ho gaya. Tumhari team khadi hai. Warriors tumhari skill ke saamne jhuk gaye.'
            },
            lose: {
              en: 'Ravi: "The Warriors fought hard. But we\'ll train in the fields and come back."',
              hi: 'Ravi: "Warriors ne bahut mehnat ki. Par hum khet mein practice karke wapas ayenge."'
            }
          },
          roasts: {
            en: [
              'Village Warriors? More like Village Walkers with that running ★★★',
              'Bro your batting is so rural even the cows are confused ★★★',
              'That bowling was slower than a bullock cart ★★★',
              'I\'ve seen better cricket from farmers during harvest ★★★',
              'The only thing you\'re conquering is the boredom ★★★'
            ],
            hi: [
              'Village Warriors? Bhai ye to Village Walkers lag rahe hain uss daud ke saath ★★★',
              'Teri batting itni gaon wali hai ki gaay bhi confuse ho rahi hai ★★★',
              'Wo bowling itni slow thi ki bail gaadi bhi tez chalti ★★★',
              'Kisano se bhi accha cricket khelta hai harvest ke time ★★★',
              'Tu sirf bore karne mein conquer kar raha hai ★★★'
            ]
          }
        },
        {
          oppName: 'Desert Storm',
          oppCountry: 'Pakistan',
          oppPlayers: [
            { name: 'Zahid M.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Noman A.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Taimoor Q.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Shahid B.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'aggressive' },
            { name: 'Rashid F.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Asif E.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Waleed I.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Haroon T.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Bilal Z.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Sajjad H.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Murad K.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Desert Storm? Nobody knows where they came from. They appeared overnight. Be careful."',
              hi: 'Ravi: "Desert Storm? Kisi ko nahi pata ye kahan se aaye. Raat ko hi appear ho gaye. Savdhaan rehna."'
            },
            win: {
              en: 'The storm passes. You stand in the silence that follows. Another mystery solved.',
              hi: 'Toofan guzar gaya. Tu uss khamoshi mein khada hai. Ek aur raaz sulajh gaya.'
            },
            lose: {
              en: 'Ravi: "The desert kept its secrets today. But we\'ll dig deeper."',
              hi: 'Ravi: "Registan ne aaj apne raaz chhupaye. Par hum aur gehrai se khodenge."'
            }
          },
          roasts: {
            en: [
              'Desert Storm? More like Desert Drizzle with that performance ★★★',
              'Bro your batting is as dry as the desert itself ★★★',
              'That bowling disappeared faster than an oasis ★★★',
              'I\'ve seen sandstorms with more direction than your bowling ★★★',
              'The only storm here is the storm of excuses ★★★'
            ],
            hi: [
              'Desert Storm? Bhai ye to Desert Drizzle lag raha hai uss performance se ★★★',
              'Teri batting bhi registan jaisi sukhi hai ★★★',
              'Wo bowling bhi bimari ki tarah gayab ho gayi ★★★',
              'Registan mein bhi bhoosa udata hai teri bowling se zyada direction ke saath ★★★',
              'Yahan pe ek hi toofan hai jo bahane ka toofan hai ★★★'
            ]
          }
        },
        {
          oppName: 'Green Force',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Vikas J.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Manish C.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Rajeev L.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Arun S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Suresh P.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Pawan K.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Mukesh R.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Deepak N.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Rajiv M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Vinod T.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Satish B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Green Force has a former state coach. They\'re organized and dangerous."',
              hi: 'Ravi: "Green Force ke paas purana state coach hai. Ye organized aur khatarnak hain."'
            },
            win: {
              en: 'The Green Force wilts under pressure. Your team proves that heart beats strategy.',
              hi: 'Green Force dabav mein murjha gaya. Tumhari team ne sabit kiya ki junoon strategy se jeeta hai.'
            },
            lose: {
              en: 'Ravi: "Their coach made the difference. We need a strategy of our own."',
              hi: 'Ravi: "Unka coach fark kar gaya. Humein bhi apni strategy chahiye."'
            }
          },
          roasts: {
            en: [
              'Green Force? More like Green Fossils with that ancient batting ★★★',
              'Bro your cricket is so green it needs sunlight to grow ★★★',
              'That bowling was so weak even grass could grow through it ★★★',
              'I\'ve seen better cricket from garden gnomes ★★★',
              'The only force here is the force of disappointment ★★★'
            ],
            hi: [
              'Green Force? Bhai ye to Green Fossils lag rahe hain uss purani batting se ★★★',
              'Teri cricket itni hari hai ki suraj ki roshni chahiye usse badhne ke liye ★★★',
              'Wo bowling itni kamzor thi ki ghas bhi ug jaati ★★★',
              'Bagiche ke dwar se bhi accha cricket khelta hai ★★★',
              'Yahan pe ek hi force hai aur wo disappointment ki force hai ★★★'
            ]
          }
        },
        {
          oppName: 'Village Legends',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Gopal T.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Harish D.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Jagdish P.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Kishore M.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'aggressive' },
            { name: 'Lalit S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Murli K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Nikhil R.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Omkar V.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Prasad G.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Rajendra N.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Sanjay W.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Village Legends — 3 years undefeated. They\'re the final boss of village cricket."',
              hi: 'Ravi: "Village Legends — 3 saal se unbeatable. Ye gaon cricket ke final boss hain."'
            },
            win: {
              en: 'The legends fall. History is made. You are the giant killers of village cricket.',
              hi: 'Legends gir gaye. Ithihaas ban gaya. Tum gaon cricket ke giant killers ho.'
            },
            lose: {
              en: 'Ravi: "Three years of undefeated streak for a reason. We need to evolve."',
              hi: 'Ravi: "3 saal se unbeatable hone ka karan hai. Humein evolve karna hoga."'
            }
          },
          roasts: {
            en: [
              'Village Legends? Legends of losing apparently ★★★',
              'Bro your batting legacy ends today ★★★',
              'That was the most legendary failure I\'ve witnessed ★★★',
              'The only legend here is how bad you played ★★★',
              'Three years of winning and you lose to this? Legendary ★★★'
            ],
            hi: [
              'Village Legends? Haarne ke legends lag rahe ho aaj ★★★',
              'Bhai teri batting ki legacy aaj khatam ho gayi ★★★',
              'Ye sabse legendary fail thi jo maine dekhi hai ★★★',
              'Yahan pe ek hi legend hai aur wo hai teri buri batting ★★★',
              '3 saal jeete aur aaj haar gaye? Legendary hai bhai ★★★'
            ]
          }
        }
      ]
    },
    {
      id: 'city',
      name: { en: 'City League', hi: 'City League' },
      subtitle: { en: 'The big city doesn\'t care about your gully', hi: 'Badi city ko tumhari gully se koi matlab nahi' },
      intro: {
        en: 'Welcome to the city. Corporate sponsors, media attention, and teams with real budgets. The city doesn\'t care about your gully story — you have to earn respect all over again.',
        hi: 'City mein swagat hai. Corporate sponsors, media attention, aur asli budget wali teams. City ko tumhari gully ki kahani se koi matlab nahi — tumhe phirse izzat kamani hogi.'
      },
      difficulty: 0.55,
      trophy: { name: 'City Champion', icon: 'platinum', medal: 'platinum' },
      matches: [
        {
          oppName: 'Metro Mavericks',
          oppCountry: 'Australia',
          oppPlayers: [
            { name: 'Josh H.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Mitch M.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Alex C.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Glenn P.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'aggressive' },
            { name: 'Pat C.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'David W.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Scott B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Nathan L.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Mitch S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Aaron H.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Marcus M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Your manager: "The Mavericks are backed by a tech billionaire. They have the best gear. But gear doesn\'t play cricket — players do."',
              hi: 'Tera manager: "Mavericks ek tech billionaire ke support mein hain. Sabse accha equipment hai. Par equipment cricket nahi khelta — khiladi khelte hain."'
            },
            win: {
              en: 'The Mavericks are mavericked. Corporate money couldn\'t buy this victory.',
              hi: 'Mavericks haar gaye. Corporate paise ye jeet nahi khareed sakte.'
            },
            lose: {
              en: 'Your manager: "Money talks. But we\'ll find a way to out-talk them."',
              hi: 'Tera manager: "Paisa bolta hai. Par hum unse zyada bolenge."'
            }
          },
          roasts: {
            en: [
              'Metro Mavericks? More like Metro Mistakes with that lineup ★★★',
              'Bro your batting is so bad even your expensive gear is embarrassed ★★★',
              'That was the most overpaid innings in cricket history ★★★',
              'The only maverick thing here is how you mavericked your wicket away ★★★',
              'Corporate backing couldn\'t save you from that embarrassment ★★★'
            ],
            hi: [
              'Metro Mavericks? Bhai ye to Metro Mistakes lag rahe hain uss lineup se ★★★',
              'Teri batting itni buri hai ki mehnga equipment bhi sharam se chhup raha hai ★★★',
              'Ye cricket itihaas ki sabse zyada paid innings thi ★★★',
              'Yahan pe ek maverick cheez hai aur wo hai tune apni wicket kaise maverick ki ★★★',
              'Corporate support bhi tujhe uss sharam se nahi bacha paya ★★★'
            ]
          }
        },
        {
          oppName: 'Underdogs United',
          oppCountry: 'England',
          oppPlayers: [
            { name: 'Ben S.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Joe R.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Jonny B.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Jofra A.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Chris W.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Liam L.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Adil R.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Harry B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Mark W.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Sam C.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Tom C.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Underdogs United — they\'ve been underestimated their whole lives. Just like us."',
              hi: 'Ravi: "Underdogs United — ye hamesha se kamzor samjhe gaye hain. Bilkul humari tarah."'
            },
            win: {
              en: 'The underdogs bite back. You prove that being underestimated is a superpower.',
              hi: 'Underdogs ne kaata! Tu sabit karta hai ki kamzor samjha jaana ek taakat hai.'
            },
            lose: {
              en: 'Ravi: "The underdogs won today. But every great story has setbacks."',
              hi: 'Ravi: "Aaj underdogs jeet gaye. Par har badi kahani mein rukawatein aati hain."'
            }
          },
          roasts: {
            en: [
              'Underdogs United? More like Underwhelming United ★★★',
              'Bro your batting is so underdog even dogs feel bad for you ★★★',
              'That was the most united failure I\'ve seen ★★★',
              'The only underdog thing here is your confidence ★★★',
              'You were so bad even the underdogs felt superior ★★★'
            ],
            hi: [
              'Underdogs United? Bhai ye to Underwhelming United lag rahe hain ★★★',
              'Teri batting itni underdog hai ki kutte bhi tujhpe taras kha rahe hain ★★★',
              'Ye sabse united fail thi jo maine dekhi hai ★★★',
              'Yahan pe ek underdog cheez hai aur wo tera confidence hai ★★★',
              'Tu itna bura tha ki underdogs bhi khud ko superior feel kar rahe the ★★★'
            ]
          }
        },
        {
          oppName: 'Titan XI',
          oppCountry: 'South Africa',
          oppPlayers: [
            { name: 'Quinton K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Kagiso R.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'David M.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Aiden M.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Tabraiz S.', role: 'all', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Anrich N.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Rassie V.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Marco J.', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Heinrich K.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Lungi N.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Wayne P.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Titan XI — big names, big egos. But egos don\'t score runs."',
              hi: 'Ravi: "Titan XI — bade naam, bade ego. Par ego runs nahi karta."'
            },
            win: {
              en: 'The Titans crumble. Your humble beginnings proved mightier than their titanic egos.',
              hi: 'Titans toot gaye. Tumhara chhota start unke bade ego se bada saabit hua.'
            },
            lose: {
              en: 'Ravi: "The Titans are tough. But even titans can fall."',
              hi: 'Ravi: "Titans tough hain. Par titans bhi gir sakte hain."'
            }
          },
          roasts: {
            en: [
              'Titan XI? More like Tiny XI after that batting collapse ★★★',
              'Bro your batting is so small even an ant could field it ★★★',
              'That was the least titanic performance ever ★★★',
              'The only titan here is the titan-sized failure ★★★',
              'You call that titan cricket? The gully is embarrassed ★★★'
            ],
            hi: [
              'Titan XI? Bhai ye to Tiny XI lag rahe hain uss batting collapse ke baad ★★★',
              'Teri batting itni chhoti hai ki cheeti bhi field kar le ★★★',
              'Ye sabse kam titanic performance thi jo kabhi hui hai ★★★',
              'Yahan pe sirf ek titan hai aur wo tera titan-size fail hai ★★★',
              'Tu ise titan cricket bolta hai? Gully bhi sharam se chhup rahi hai ★★★'
            ]
          }
        },
        {
          oppName: 'Shadow Squad',
          oppCountry: 'England',
          oppPlayers: [
            { name: 'Jos B.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Moeen A.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Liam D.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Chris J.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'aggressive' },
            { name: 'Liam W.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Jason R.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Saqib M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Matt P.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Dawid M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Reece T.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Sam C.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Shadow Squad plays dirty. Watch out for sledging and mind games."',
              hi: 'Ravi: "Shadow Squad ganda khelta hai. Sledging aur dimaag ke khel se bachke rehna."'
            },
            win: {
              en: 'The shadows retreat. You proved that light always beats darkness.',
              hi: 'Shadows bhaag gaye. Tu ne sabit kiya ki roshni hamesha andhera jeeti hai.'
            },
            lose: {
              en: 'Ravi: "They played dirty and it worked. We need to be mentally stronger."',
              hi: 'Ravi: "Inhone ganda khela aur kaam ho gaya. Humein mentally aur mazboot hona hoga."'
            }
          },
          roasts: {
            en: [
              'Shadow Squad? More like Shadow Clowns with that dirty play ★★★',
              'Bro your batting is so dark even shadows are scared ★★★',
              'That was the most sneaky innings I\'ve ever seen ★★★',
              'The only shadow here is the shadow of defeat ★★★',
              'You play in shadows because you can\'t handle the spotlight ★★★'
            ],
            hi: [
              'Shadow Squad? Bhai ye to Shadow Clowns lag rahe hain uss gande khel se ★★★',
              'Teri batting itni dark hai ki shadows bhi darr gaye ★★★',
              'Ye sabse chalaki bhari innings thi jo maine dekhi ★★★',
              'Yahan pe ek hi shadow hai aur wo haar ka shadow hai ★★★',
              'Tu shadows mein khelta hai kyunki spotlight jhel nahi sakta ★★★'
            ]
          }
        },
        {
          oppName: 'City Champions',
          oppCountry: 'South Africa',
          oppPlayers: [
            { name: 'Temba B.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Reeza H.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Rassie V.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Keshav M.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'George L.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Heinrich K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Lungi N.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Dwaine P.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Andile P.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Bjorn F.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Sisanda M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "City Champions — they have everything. Funding, facilities, fame. But they don\'t have heart."',
              hi: 'Ravi: "City Champions — ke paas sab kuch hai. Funding, facilities, fame. Par dil nahi hai."'
            },
            win: {
              en: 'The city bows to you. From gully to city champion. Ravi can\'t stop crying.',
              hi: 'City tumhare saamne jhuk gayi. Gully se city champion tak. Ravi rok nahi paa raha.'
            },
            lose: {
              en: 'Ravi: "The city is tough. But we didn\'t come this far to only come this far."',
              hi: 'Ravi: "City tough hai. Par hum itna door isliye nahi aaye ki bas itna door aaye."'
            }
          },
          roasts: {
            en: [
              'City Champions? The city deserves better champions ★★★',
              'Bro your batting is so overrated the city wants a refund ★★★',
              'That was the most disappointing championship defense ★★★',
              'The only champion thing about you is your champion excuses ★★★',
              'You call that city-level cricket? The gully is embarrassed ★★★'
            ],
            hi: [
              'City Champions? City ko acche champions chahiye ★★★',
              'Bhai teri batting itni overrated hai ki city refund chahti hai ★★★',
              'Ye sabse disappointing championship defense thi ★★★',
              'Tujhme sirf champion cheez hai teri champion bahane ★★★',
              'Tu ise city-level cricket bolta hai? Gully bhi sharam se chhup rahi hai ★★★'
            ]
          }
        }
      ]
    },
    {
      id: 'district',
      name: { en: 'District Championship', hi: 'Zila Championship' },
      subtitle: { en: 'Districts fight for glory', hi: 'Zile izzat ke liye lad rahe hain' },
      intro: {
        en: 'The district level is where politics meets cricket. Teams are backed by powerful people. There\'s a player called "The Wall" who hasn\'t been beaten in 20 matches. Can you break through?',
        hi: 'Zila level wahan hai jahan rajniti aur cricket milti hain. Teams powerful logon ke support mein hain. "The Wall" naam ka ek player hai jo 20 match se nahi haara. Kya tod sakte ho?'
      },
      difficulty: 0.65,
      trophy: { name: 'District Conqueror', icon: 'diamond', medal: 'diamond' },
      matches: [
        {
          oppName: 'District Tigers',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Rohit S.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Shikhar D.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Cheteshwar P.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Ravindra J.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Hardik P.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Dinesh K.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Jasprit B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Mohammed S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Kuldeep Y.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Axar P.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Shardul T.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The Tigers are backed by a powerful politician. They think they can\'t be touched."',
              hi: 'Ravi: "Tigers ek powerful neta ke support mein hain. Inko lagta hai koi chhu nahi sakta."'
            },
            win: {
              en: 'The Tigers are tamed. Political backing means nothing on the pitch.',
              hi: 'Tigers tame ho gaye. Political support pitch pe kuch nahi karta.'
            },
            lose: {
              en: 'Ravi: "Politics tried to beat us. But we\'ll come back with pure cricket."',
              hi: 'Ravi: "Rajniti ne humse jeetne ki koshish ki. Par hum shudh cricket ke saath wapas ayenge."'
            }
          },
          roasts: {
            en: [
              'District Tigers? More like District Kittens after that performance ★★★',
              'Bro your batting is so weak even a kitten could bowl you out ★★★',
              'That was the least tigerish innings I\'ve ever seen ★★★',
              'The only roaring here is the crowd laughing at you ★★★',
              'You call that batting? Even the stumps are yawning ★★★'
            ],
            hi: [
              'District Tigers? Bhai ye to District Kittens lag rahe hain uss performance se ★★★',
              'Teri batting itni kamzor hai ki billi bhi tujhe out kar de ★★★',
              'Ye sabse kam tigerish innings thi jo maine dekhi ★★★',
              'Yahan pe sirf crowd ki hasi goonj rahi hai ★★★',
              'Tu ise batting bolta hai? Stumps bhi yaun kar rahe hain ★★★'
            ]
          }
        },
        {
          oppName: 'Royal Challengers',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Virat K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Faf D.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Glenn M.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Shahbaz A.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Wanindu H.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Dinesh K.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Harshal P.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Mohammed S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Josh H.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Rajat P.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Karn S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Royal Challengers — they\'ve been the runners-up 2 times. They\'re desperate to win."',
              hi: 'Ravi: "Royal Challengers — ye 2 baar runners-up rahe hain. Jeetne ke liye desperate hain."'
            },
            win: {
              en: 'The Royals fall. Their desperation cost them the game. You stay composed.',
              hi: 'Royals gir gaye. Unka desperation unhe le dooba. Tu calm raha.'
            },
            lose: {
              en: 'Ravi: "Desperation makes them dangerous. We need to match their intensity."',
              hi: 'Ravi: "Desperation unhe khatarnak banata hai. Hum bhi unki intensity ke barabar khelenge."'
            }
          },
          roasts: {
            en: [
              'Royal Challengers? More like Royal Chokers with that pressure performance ★★★',
              'Bro your batting choked harder than a fish out of water ★★★',
              'That was the most royal disaster I\'ve witnessed ★★★',
              'The only challenge here is watching your innings without laughing ★★★',
              'Two-time runners-up and you play like this? Pathetic ★★★'
            ],
            hi: [
              'Royal Challengers? Bhai ye to Royal Chokers lag rahe hain uss pressure mein ★★★',
              'Teri batting paani se nikli machli jaisi ruk rahi hai ★★★',
              'Ye sabse royal disaster thi jo maine dekhi hai ★★★',
              'Yahan pe ek hi challenge hai aur wo bina has ke teri innings dekhna ★★★',
              '2 baar runners-up aur aisa khel? Shakuni bhi sharam kare ★★★'
            ]
          }
        },
        {
          oppName: 'Night Riders',
          oppCountry: 'West Indies',
          oppPlayers: [
            { name: 'Chris G.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Andre R.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Kieron P.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Sunil N.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Jason H.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Nicholas P.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Obed M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Alzarri J.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Akeal H.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Rovman P.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Sheldon C.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Night Riders play their best under pressure. The louder the crowd, the better they get."',
              hi: 'Ravi: "Night Riders pressure mein sabse accha khelte hain. Crowd jitna zyada chillaye, ye utne acche hote hain."'
            },
            win: {
              en: 'The night belongs to you. The Riders\' darkness couldn\'t match your light.',
              hi: 'Raat tumhari hai. Riders ka andhera tumhari roshni ke barabar nahi tha.'
            },
            lose: {
              en: 'Ravi: "The night was theirs. But dawn always comes."',
              hi: 'Ravi: "Raat to unki thi. Par subah hamesha aati hai."'
            }
          },
          roasts: {
            en: [
              'Night Riders? More like Night Criers with that losing performance ★★★',
              'Bro your batting is so dark even midnight is confused ★★★',
              'That was the most nightmarish innings ever ★★★',
              'The only riding happening is riding the bench ★★★',
              'You play cricket like it\'s a horror movie ★★★'
            ],
            hi: [
              'Night Riders? Bhai ye to Night Criers lag rahe hain uss haar se ★★★',
              'Teri batting itni dark hai ki raat bhi confuse ho rahi hai ★★★',
              'Ye sabse nightmarish innings thi jo kabhi hui ★★★',
              'Yahan pe sirf bench pe baith ke riding ho rahi hai ★★★',
              'Tu cricket khelta hai jaise horror movie ho ★★★'
            ]
          }
        },
        {
          oppName: 'Provincial Kings',
          oppCountry: 'Australia',
          oppPlayers: [
            { name: 'Steve S.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'David W.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Marnus L.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Cameron G.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Mitch M.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Travis H.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Pat C.', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Mitch S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Josh H.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Adam Z.', role: 'all', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Marcus H.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Provincial Kings have Australian discipline. They don\'t make mistakes."',
              hi: 'Ravi: "Provincial Kings ke paas Australian discipline hai. Ye galti nahi karte."'
            },
            win: {
              en: 'The Kings lose their crown. Discipline met its match against your heart.',
              hi: 'Kings ne takht khoya. Discipline tumhare junoon se haar gaya.'
            },
            lose: {
              en: 'Ravi: "Australian discipline is real. We need to tighten our game."',
              hi: 'Ravi: "Australian discipline sach mein hai. Humein apna game tight karna hoga."'
            }
          },
          roasts: {
            en: [
              'Provincial Kings? More like Provincial Knitters with that boring cricket ★★★',
              'Bro your batting is so disciplined it forgot to be exciting ★★★',
              'That was the most royal yawn I\'ve ever experienced ★★★',
              'The only king thing here is the king-sized disappointment ★★★',
              'You play cricket like you\'re filing taxes ★★★'
            ],
            hi: [
              'Provincial Kings? Bhai ye to Provincial Knitters lag rahe hain boring cricket se ★★★',
              'Teri batting itni disciplined hai ki exciting bhool gayi ★★★',
              'Ye sabse badi royal yaun thi jo maine experience ki ★★★',
              'Yahan pe sirf king-size disappointment hai ★★★',
              'Tu cricket khelta hai jaise tax bhar raha ho ★★★'
            ]
          }
        },
        {
          oppName: 'District Champions',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Rahul D.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Shreyas I.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Suryakumar Y.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Ravindra J.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Axar P.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'KL R.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Jasprit B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Mohammed S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Kuldeep Y.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Ishan K.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Umran M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The District Champions — they have the best players from every zone. This is the real test."',
              hi: 'Ravi: "District Champions — har zone ke acche players hain inke paas. Ye asli test hai."'
            },
            win: {
              en: 'You are the new District Champions. From gully to district — the journey is legendary.',
              hi: 'Tum naye District Champion ho. Gully se district tak — safar legendary hai.'
            },
            lose: {
              en: 'Ravi: "The champions showed us our level. Now we know what to work on."',
              hi: 'Ravi: "Champions ne humein hamari level dikha di. Ab hume pata hai kya karna hai."'
            }
          },
          roasts: {
            en: [
              'District Champions? The district deserves a better champion ★★★',
              'Bro your batting championship reign is over ★★★',
              'That was the most un-champion-like performance ★★★',
              'The only thing you\'re championing is mediocrity ★★★',
              'You call that champion cricket? The gully is embarrassed ★★★'
            ],
            hi: [
              'District Champions? District ko accha champion chahiye ★★★',
              'Bhai teri batting championship ka raaj khatam ★★★',
              'Ye sabse un-champion-like performance thi ★★★',
              'Tu sirf mediocrity ka champion hai ★★★',
              'Tu ise champion cricket bolta hai? Gully bhi sharam se chhup rahi hai ★★★'
            ]
          }
        }
      ]
    },
    {
      id: 'state',
      name: { en: 'State Tournament', hi: 'State Tournament' },
      subtitle: { en: 'State level — no mercy', hi: 'State level — koi daya nahi' },
      intro: {
        en: 'State level is brutal. Corporate buyouts, the fastest bowler "Lightning" Kumar, and hostile home crowds. This is where dreams go to die — or become immortal.',
        hi: 'State level bahut khatarnak hai. Corporate buyouts, sabse tez bowler "Lightning" Kumar, aur hostile home crowd. Yahan sapne mare jaate hain — ya amar ho jaate hain.'
      },
      difficulty: 0.75,
      trophy: { name: 'State Warrior', icon: 'ruby', medal: 'ruby' },
      matches: [
        {
          oppName: 'State Strikers',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Prithvi S.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Devdutt P.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Ruturaj G.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Nitish R.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Venkatesh I.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Riyan P.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Umran M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Arshdeep S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Ravi B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Shahrukh K.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Rahul T.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Your coach: "The Strikers have corporate money behind them. They bought the best players. But money can\'t buy teamwork."',
              hi: 'Tera coach: "Strikers ke paas corporate paise hain. Sabse acche players khareede hain. Par paisa teamwork nahi khareed sakta."'
            },
            win: {
              en: 'Corporate money falls to grassroots talent. Your coach smiles for the first time.',
              hi: 'Corporate paise grassroots talent se haar gaye. Tera coach pehli baar muskuraya.'
            },
            lose: {
              en: 'Your coach: "They outplayed us. Time to train twice as hard."',
              hi: 'Tera coach: "Unhone humse accha khela. Ab doguni mehnat karni hogi."'
            }
          },
          roasts: {
            en: [
              'State Strikers? More like State Snoozers with that energy ★★★',
              'Bro your batting is so overpaid even your sponsors want a refund ★★★',
              'That was the most expensive failure in cricket history ★★★',
              'The only striking thing here is how badly you played ★★★',
              'Corporate money, zero results. Classic ★★★'
            ],
            hi: [
              'State Strikers? Bhai ye to State Snoozers lag rahe hain uss energy se ★★★',
              'Teri batting itni overpaid hai ki sponsors bhi refund chahte hain ★★★',
              'Ye sabse mehnga fail tha cricket itihaas mein ★★★',
              'Yahan pe striking sirf teri buri batting hai ★★★',
              'Corporate paise, zero results. Classic hai bhai ★★★'
            ]
          }
        },
        {
          oppName: 'Empire XI',
          oppCountry: 'Pakistan',
          oppPlayers: [
            { name: 'Babar A.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Fakhar Z.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Mohammad R.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Shadab K.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Iftikhar A.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Khushdil S.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'defensive' },
            { name: 'Shaheen A.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Haris R.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Naseem S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Usama M.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Shaheen S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Empire XI — they play like they own the place. Arrogance meets skill."',
              hi: 'Ravi: "Empire XI — ye khelte hain jaise ye jagah unki hai. Ahankaar aur skill ka milap."'
            },
            win: {
              en: 'The empire crumbles. Humility taught through cricket.',
              hi: 'Empire toot gaya. Cricket ke zariye tameez sikhayi.'
            },
            lose: {
              en: 'Ravi: "Their arrogance was backed by skill today. We need both."',
              hi: 'Ravi: "Unka ahankaar skill ke saath tha aaj. Humein bhi dono chahiye."'
            }
          },
          roasts: {
            en: [
              'Empire XI? The only empire here is the empire of excuses ★★★',
              'Bro your batting is so overrated it should be a museum exhibit ★★★',
              'That was the most imperial disaster in cricket ★★★',
              'The only ruling you\'re doing is ruling the loss column ★★★',
              'Empire? More like vampire sucking the life out of cricket ★★★'
            ],
            hi: [
              'Empire XI? Yahan pe sirf bahano ka empire hai ★★★',
              'Teri batting itni overrated hai ki museum mein honi chahiye ★★★',
              'Ye sabse imperial disaster thi cricket mein ★★★',
              'Tu sirf haar column pe rule kar raha hai ★★★',
              'Empire? Bhai tu to vampire hai cricket ki life cheen raha hai ★★★'
            ]
          }
        },
        {
          oppName: 'Thunderbolts',
          oppCountry: 'Australia',
          oppPlayers: [
            { name: 'Marcus S.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Peter H.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Matt L.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Glenn M.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Sean A.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Tim D.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Mitch S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Josh H.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Nathan L.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' },
            { name: 'Marcus M.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Scott B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Thunderbolts are fast. Their bowling attack is like facing lightning."',
              hi: 'Ravi: "Thunderbolts bahut tez hain. Inki bowling attack bilkul bijli jaisi hai."'
            },
            win: {
              en: 'The thunder dies down. You survived the storm and came out stronger.',
              hi: 'Thunder band ho gaya. Tu toofan se bacha aur aur mazboot ho gaya.'
            },
            lose: {
              en: 'Ravi: "The thunder was too loud today. But we\'ll find the mute button."',
              hi: 'Ravi: "Aaj thunder bahut zyada tha. Par hum iska mute button dhundh lenge."'
            }
          },
          roasts: {
            en: [
              'Thunderbolts? More like Thunderbolts and Lightning Very Very Frightening ★★★',
              'Bro your batting is so slow the thunder fell asleep ★★★',
              'That was the most un-thunderous performance ★★★',
              'The only bolt here is the bolt from your wicket ★★★',
              'You call that thunder? Even the clouds are disappointed ★★★'
            ],
            hi: [
              'Thunderbolts? Bhai ye to Thunderbolts and Lightning Very Very Frightening hai ★★★',
              'Teri batting itni slow hai ki thunder bhi so gaya ★★★',
              'Ye sabse un-thunderous performance thi ★★★',
              'Yahan pe sirf bolt hai aur wo teri wicket se hai ★★★',
              'Tu ise thunder bolta hai? Baddal bhi disappointed hain ★★★'
            ]
          }
        },
        {
          oppName: 'Phoenix Rising',
          oppCountry: 'New Zealand',
          oppPlayers: [
            { name: 'Kane W.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Devon C.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Glenn P.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Mitch S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Daryl M.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Tom L.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Trent B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Tim S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Lockie F.', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Ish S.', role: 'all', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Matt H.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Phoenix Rising — they came back from nowhere. Never underestimate a team that refuses to die."',
              hi: 'Ravi: "Phoenix Rising — ye kahin se aa gaye. Kabhi bhi uss team ko kam mat samajhna jo marna nahi chahti."'
            },
            win: {
              en: 'The phoenix burns out. Your team proves that some fires are brighter.',
              hi: 'Phoenix jal gaya. Tumhari team ne sabit kiya ki kuch aag aur tez hoti hai.'
            },
            lose: {
              en: 'Ravi: "The phoenix rose from ashes. We need to find our own fire."',
              hi: 'Ravi: "Phoenix khaak se utha. Hummein bhi apni aag dhoondni hogi."'
            }
          },
          roasts: {
            en: [
              'Phoenix Rising? More like Phoenix Crawling with that pace ★★★',
              'Bro your batting is so flat the phoenix wouldn\'t rise from it ★★★',
              'That was the most un-rising performance ever ★★★',
              'The only fire here is the fire of your embarrassing innings ★★★',
              'You can\'t rise when your cricket is this grounded ★★★'
            ],
            hi: [
              'Phoenix Rising? Bhai ye to Phoenix Crawling lag raha hai uss pace se ★★★',
              'Teri batting itni flat hai ki phoenix bhi isse nahi uthega ★★★',
              'Ye sabse un-rising performance thi jo kabhi hui ★★★',
              'Yahan pe sirf ek aag hai aur wo teri embarrassing innings ki aag hai ★★★',
              'Tu uth nahi sakta jab teri cricket itni neeche hai ★★★'
            ]
          }
        },
        {
          oppName: 'Capital Kings',
          oppCountry: 'England',
          oppPlayers: [
            { name: 'Joe R.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Ben S.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Zak C.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Liam L.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Moeen A.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Harry B.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Mark W.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Jofra A.', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Chris W.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Adil R.', role: 'all', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Sam C.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Capital Kings — they play with English precision. Every run is calculated."',
              hi: 'Ravi: "Capital Kings — ye English precision se khelte hain. Har run calculated hai."'
            },
            win: {
              en: 'The kings of the capital bow down. Your instinct beats their calculation.',
              hi: 'Capital ke kings jhuk gaye. Tera instinct unki calculation se jeeta.'
            },
            lose: {
              en: 'Ravi: "Precision is their weapon. We need to be more clinical."',
              hi: 'Ravi: "Precision unka hathiyar hai. Humein bhi clinical hona hoga."'
            }
          },
          roasts: {
            en: [
              'Capital Kings? The capital is embarrassed to be represented by you ★★★',
              'Bro your batting precision is as off as British weather ★★★',
              'That was the most un-royal performance ★★★',
              'The only capital thing here is the capital loss ★★★',
              'You play cricket like you\'re driving on the wrong side ★★★'
            ],
            hi: [
              'Capital Kings? Capital tujhe represent karne pe sharam aa rahi hai ★★★',
              'Bhai teri batting precision British weather jaisi hai ★★★',
              'Ye sabse un-royal performance thi ★★★',
              'Yahan pe sirf capital loss hai ★★★',
              'Tu cricket khelta hai jaise galat side pe driving kar raha ho ★★★'
            ]
          }
        },
        {
          oppName: 'State Champions',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Shubman G.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Yashasvi J.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Ishan K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Rinku S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Tilak V.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Rahul T.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'defensive' },
            { name: 'Umran M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Arshdeep S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Ravi B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Washington S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Shahrukh K.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "State Champions — the best of the best. This is the gateway to national level."',
              hi: 'Ravi: "State Champions — sabse acche players. Ye national level ka darwaza hai."'
            },
            win: {
              en: 'State Champions defeated. You\'ve punched your ticket to the national stage.',
              hi: 'State Champions haar gaye. Tu national stage ka ticket le chuka.'
            },
            lose: {
              en: 'Ravi: "The state champions showed us the gap. We\'ll fill it."',
              hi: 'Ravi: "State Champions ne humein gap dikha diya. Hum bhar lenge."'
            }
          },
          roasts: {
            en: [
              'State Champions? The state is filing a complaint about your performance ★★★',
              'Bro your batting is so bad the state anthem is crying ★★★',
              'That was the most un-champion state performance ★★★',
              'The only state here is the state of your disastrous batting ★★★',
              'You represent the state? The state wants a new representative ★★★'
            ],
            hi: [
              'State Champions? State teri performance pe complaint kar raha hai ★★★',
              'Bhai teri batting itni buri hai ki state anthem ro raha hai ★★★',
              'Ye sabse un-champion state performance thi ★★★',
              'Yahan pe sirf state hai aur wo teri batting ki buri state hai ★★★',
              'Tu state ko represent karta hai? State naya representative chahta hai ★★★'
            ]
          }
        }
      ]
    },
    {
      id: 'national',
      name: { en: 'National Qualifier', hi: 'National Qualifier' },
      subtitle: { en: 'Only the best survive', hi: 'Sirf acche bachte hain' },
      intro: {
        en: 'The national qualifier. Regional styles clash. The Northern Storm bring spin, the Southern Thunder bring pace. You\'re facing the best from every corner of the country. There\'s a team that\'s been runners-up twice — desperate to finally win.',
        hi: 'National qualifier. Regional styles takra rahe hain. Northern Storm spin late hain, Southern Thunder pace late hain. Tu desh ke kone-kone ke acche players se lad raha hai. Ek team hai jo 2 baar runners-up rahi — jeetne ke liye desperate hai.'
      },
      difficulty: 0.85,
      trophy: { name: 'National Qualifier', icon: 'emerald', medal: 'emerald' },
      matches: [
        {
          oppName: 'Northern Storm',
          oppCountry: 'Sri Lanka',
          oppPlayers: [
            { name: 'Pathum N.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Kusal M.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Charith A.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Wanindu H.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Dasun S.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Dhananjaya S.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Maheesh T.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Wanidu H.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Dilshan M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Sadeera S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Dunith W.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Northern Storm — masters of spin. Their bowlers will turn the ball like a top."',
              hi: 'Ravi: "Northern Storm — spin ke masters. Inke bowlers ball ko top ki tarah ghumayenge."'
            },
            win: {
              en: 'The storm passes north. You survived the spin web and emerged victorious.',
              hi: 'Storm uttar ki taraf chala gaya. Tu spin ke jaal se bacha aur jeet gaya.'
            },
            lose: {
              en: 'Ravi: "The spin was too much. We need to work on our footwork."',
              hi: 'Ravi: "Spin bahut zyada tha. Hummein footwork pe kaam karna hoga."'
            }
          },
          roasts: {
            en: [
              'Northern Storm? The only storm here is the storm of your terrible batting ★★★',
              'Bro your batting is so lost even GPS can\'t find it ★★★',
              'That was the most un-stormy performance ★★★',
              'The only spinning happening is your head after that delivery ★★★',
              'You got more confused than a cat in a spinning room ★★★'
            ],
            hi: [
              'Northern Storm? Yahan pe sirf teri batting ke toofan ka toofan hai ★★★',
              'Bhai teri batting itni lost hai ki GPS bhi nahi dhoond pa raha ★★★',
              'Ye sabse un-stormy performance thi ★★★',
              'Yahan pe sirf ghoom raha hai tera dimaag uss gend ke baad ★★★',
              'Tu billi jaisa confusion mein hai ghumte hue kamre mein ★★★'
            ]
          }
        },
        {
          oppName: 'Southern Thunder',
          oppCountry: 'New Zealand',
          oppPlayers: [
            { name: 'Devon C.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Glenn P.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Daryl M.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Mitch S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Mark C.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Tom L.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Trent B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Tim S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Lockie F.', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Ish S.', role: 'all', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Matt H.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Southern Thunder brings raw pace. Their fast bowlers will test your reflexes."',
              hi: 'Ravi: "Southern Thunder raw pace la rahe hain. Inke fast bowlers tumhari reflex test karenge."'
            },
            win: {
              en: 'The thunder from the south is silenced. You stood tall against the fastest attack.',
              hi: 'Dakshin ka thunder khamosh ho gaya. Tu sabse tez attack ke saamne khada raha.'
            },
            lose: {
              en: 'Ravi: "The pace was overwhelming. We need to learn to play fast bowling better."',
              hi: 'Ravi: "Pace bahut zyada tha. Hummein fast bowling better khelna seekhna hoga."'
            }
          },
          roasts: {
            en: [
              'Southern Thunder? More like Southern Whispers after that performance ★★★',
              'Bro your batting is so slow the thunder took a nap ★★★',
              'That was the most un-thunderous attack I\'ve seen ★★★',
              'The only lightning here is the lightning of your terrible shots ★★★',
              'You can\'t handle the heat? Then get out of the thunder ★★★'
            ],
            hi: [
              'Southern Thunder? Bhai ye to Southern Whispers lag rahe hain uss performance se ★★★',
              'Teri batting itni slow hai ki thunder bhi so gaya ★★★',
              'Ye sabse un-thunderous attack thi jo maine dekhi ★★★',
              'Yahan pe sirf ek lightning hai aur wo teri buri shots ki lightning hai ★★★',
              'Tu garmi jhel nahi sakta? Toh thunder se nikal ja ★★★'
            ]
          }
        },
        {
          oppName: 'Eastern Eagles',
          oppCountry: 'South Africa',
          oppPlayers: [
            { name: 'Quinton K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Aiden M.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Rassie V.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'David M.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Heinrich K.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Marco J.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Kagiso R.', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Anrich N.', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Lungi N.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Tabraiz S.', role: 'all', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Wayne P.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'defensive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Eastern Eagles soar high. Their batting lineup is one of the best in the country."',
              hi: 'Ravi: "Eastern Eagles bahut udd rahe hain. Inki batting lineup desh ki sabse acchi hai."'
            },
            win: {
              en: 'The eagles crash land. Your fielding saved the day. Every run was fought for.',
              hi: 'Eagles gir gaye. Teri fielding ne din bachaya. Har run ke liye ladai hui.'
            },
            lose: {
              en: 'Ravi: "Their batting was flawless. We need to bowl better."',
              hi: 'Ravi: "Unki batting flawless thi. Hummein bowling better karni hogi."'
            }
          },
          roasts: {
            en: [
              'Eastern Eagles? More like Eastern Groundhogs staying on the ground ★★★',
              'Bro your batting is so bad even the eagle feathers are falling off ★★★',
              'That was the most grounded performance from an eagle team ★★★',
              'The only soaring happening is your ego, not your cricket ★★★',
              'Eagles? The only thing flying here is the ball past your wicket ★★★'
            ],
            hi: [
              'Eastern Eagles? Bhai ye to Eastern Groundhogs lag rahe hain zameen pe ★★★',
              'Teri batting itni buri hai ki eagle ke pankh bhi gir rahe hain ★★★',
              'Ye sabse grounded performance thi ek eagle team ki ★★★',
              'Yahan pe sirf tera ego udd raha hai, cricket nahi ★★★',
              'Eagles? Yahan pe sirf ball teri wicket ke paas ud rahi hai ★★★'
            ]
          }
        },
        {
          oppName: 'Western Wolves',
          oppCountry: 'West Indies',
          oppPlayers: [
            { name: 'Shai H.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Brandon K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Shimron H.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Kyle M.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Roston C.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Nicholas P.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Alzarri J.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Obed M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Akeal H.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Gudakesh M.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Sheldon C.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "Western Wolves hunt in packs. Their fielding is elite and they never give up."',
              hi: 'Ravi: "Western Wolves jhund mein shikar karte hain. Inki fielding elite hai aur ye kabhi nahi chhodte."'
            },
            win: {
              en: 'The wolves retreat to their den. You outplayed the pack mentality.',
              hi: 'Wolves apne ghonsle mein laut gaye. Tu ne jhund ki soch se jeeta.'
            },
            lose: {
              en: 'Ravi: "The wolves got us today. But we\'ll study their pack tactics."',
              hi: 'Ravi: "Wolves ne aaj hamara kaat liya. Par hum unki jhund strategy padhenge."'
            }
          },
          roasts: {
            en: [
              'Western Wolves? More like Western Puppies with that performance ★★★',
              'Bro your batting is so weak even a puppy could bowl you out ★★★',
              'That was the least wolf-like performance ★★★',
              'The only howling here is the crowd at your batting ★★★',
              'You call that pack cricket? The pack is ashamed ★★★'
            ],
            hi: [
              'Western Wolves? Bhai ye to Western Puppies lag rahe hain uss performance se ★★★',
              'Teri batting itni kamzor hai ki puppy bhi tujhe out kar de ★★★',
              'Ye sabse kam wolf-like performance thi ★★★',
              'Yahan pe sirf crowd ki howling hai teri batting pe ★★★',
              'Tu ise pack cricket bolta hai? Pack sharam se chhup raha hai ★★★'
            ]
          }
        },
        {
          oppName: 'National Contenders',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Shubman G.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Yashasvi J.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Ruturaj G.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Rinku S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Tilak V.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Ishan K.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Umran M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Arshdeep S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Ravi B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Washington S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Shahrukh K.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The National Contenders — 2-time runners-up. They\'re desperate. Desperation makes them dangerous."',
              hi: 'Ravi: "National Contenders — 2 baar runners-up. Ye desperate hain. Desperation unhe khatarnak banata hai."'
            },
            win: {
              en: 'The contenders are eliminated. You\'ve earned your place in the national championship.',
              hi: 'Contenders bahar ho gaye. Tu national championship mein jagah bana chuka.'
            },
            lose: {
              en: 'Ravi: "They wanted it more today. But the national stage awaits us."',
              hi: 'Ravi: "Aaj unhone humse zyada chaha. Par national stage humara intezar kar raha hai."'
            }
          },
          roasts: {
            en: [
              'National Contenders? The nation is embarrassed by your performance ★★★',
              'Bro your batting contention ended before it started ★★★',
              'That was the most un-contending performance ★★★',
              'The only thing you\'re contending for is last place ★★★',
              'Two-time runners-up and you play like this? National embarrassment ★★★'
            ],
            hi: [
              'National Contenders? Nation tujhe dekh ke sharam aa raha hai ★★★',
              'Bhai teri batting contention shuru hone se pehle hi khatam ho gayi ★★★',
              'Ye sabse un-contending performance thi ★★★',
              'Tu sirf last place ke liye contend kar raha hai ★★★',
              '2 baar runners-up aur aisa khel? National embarrassment hai bhai ★★★'
            ]
          }
        }
      ]
    },
    {
      id: 'championship',
      name: { en: 'National Championship', hi: 'National Championship' },
      subtitle: { en: 'This is it. The final frontier.', hi: 'Ye wohi hai. Aakhri frontier.' },
      intro: {
        en: 'You\'ve made it to the National Championship. The Legends, The Invincibles, The Dark Horses, The Dynasty — each one a titan of cricket. And at the end, a mirror of your own story awaits. This is where legends are made.',
        hi: 'Tu National Championship mein pahunch gaya. The Legends, The Invincibles, The Dark Horses, The Dynasty — har ek cricket ka titan hai. Aur aakhir mein, teri khud ki kahani ka aaina hai. Yahan legends bante hain.'
      },
      difficulty: 0.95,
      trophy: { name: 'National Champion', icon: 'crown', medal: 'crown' },
      matches: [
        {
          oppName: 'The Legends',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'Sachin T.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Sourav G.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Rahul D.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Anil K.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Harbhajan S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'VVS L.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Zaheer K.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Javagal S.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Ashish N.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Yuvraj S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Gautam G.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The Legends — former champions. They play with the weight of history. Can we match their experience?"',
              hi: 'Ravi: "The Legends — purane champions. Ye itihaas ke bojh se khelte hain. Kya hum unka experience de sakte hain?"'
            },
            win: {
              en: 'You\'ve defeated the Legends. History bows to the present. Ravi can barely speak.',
              hi: 'Tu ne Legends ko hara diya. Itihaas vartaman ke saamne jhuk gaya. Ravi kuch bol nahi pa raha.'
            },
            lose: {
              en: 'Ravi: "The Legends showed us what greatness looks like. We\'ll reach there."',
              hi: 'Ravi: "Legends ne humein dikha ki mahanta kaisi hoti hai. Hum wahan pahunchenge."'
            }
          },
          roasts: {
            en: [
              'The Legends? The only legend here is how badly you lost ★★★',
              'Bro your batting is so outdated even the legends cringe ★★★',
              'That was the most un-legendary performance ★★★',
              'The only legacy you\'re leaving is a legacy of failure ★★★',
              'Legends? You can\'t even legend properly ★★★'
            ],
            hi: [
              'The Legends? Yahan pe sirf teri haar ka legend hai ★★★',
              'Bhai teri batting itni purani hai ki legends bhi cringe kar rahe hain ★★★',
              'Ye sabse un-legendary performance thi ★★★',
              'Tu sirf haar ki legacy chhod raha hai ★★★',
              'Legends? Tu sahi se legend bhi nahi ban sakta ★★★'
            ]
          }
        },
        {
          oppName: 'The Invincibles',
          oppCountry: 'Australia',
          oppPlayers: [
            { name: 'Ricky P.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Adam G.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Matthew H.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Shane W.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Andrew S.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Michael C.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Glenn M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Brett L.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Mitch J.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Nathan L.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Shane L.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The Invincibles — they\'ve never lost a tournament. Their record is perfect. Tonight, we break perfection."',
              hi: 'Ravi: "The Invincibles — ye kabhi tournament nahi haare. Inka record perfect hai. Aaj hum perfection todenge."'
            },
            win: {
              en: 'The Invincibles are finally defeated. Perfection has been broken. You\'ve made history.',
              hi: 'Invincibles finally haar gaye. Perfection toot gaya. Tu ne itihaas bana diya.'
            },
            lose: {
              en: 'Ravi: "They were invincible today. But invincibility is a myth. We\'ll prove it."',
              hi: 'Ravi: "Aaj ye invincible the. Par invincibility ek myth hai. Hum sabit karenge."'
            }
          },
          roasts: {
            en: [
              'The Invincibles? The only invincible thing is your ego ★★★',
              'Bro your batting is so bad even perfectionists are disappointed ★★★',
              'That was the most defeatable performance I\'ve witnessed ★★★',
              'The only thing invincible here is your ability to lose ★★★',
              'Invincibles? The only thing you\'ve invented is new ways to lose ★★★'
            ],
            hi: [
              'The Invincibles? Yahan pe sirf tera ego invincible hai ★★★',
              'Bhai teri batting itni buri hai ki perfectionists bhi disappointed hain ★★★',
              'Ye sabse defeatable performance thi jo maine dekhi ★★★',
              'Yahan pe sirf ek invincible cheez hai aur wo teri haarne ki kshamta hai ★★★',
              'Invincibles? Tu sirf haarne ke naye tareefe invent kar raha hai ★★★'
            ]
          }
        },
        {
          oppName: 'The Dark Horses',
          oppCountry: 'England',
          oppPlayers: [
            { name: 'Jos B.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Ben S.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Joe R.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Moeen A.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Liam L.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Harry B.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Jofra A.', role: 'bowler', battingStyle: 'balanced', bowlingStyle: 'aggressive' },
            { name: 'Mark W.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Chris W.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Adil R.', role: 'all', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Sam C.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The Dark Horses — nobody expected them here. They\'re unpredictable and dangerous."',
              hi: 'Ravi: "The Dark Horses — kisi ne nahi socha tha ye yahan honge. Ye unpredictable aur khatarnak hain."'
            },
            win: {
              en: 'The dark horse falls. You proved that you can handle surprise and still win.',
              hi: 'Dark horse gir gaya. Tu ne sabit kiya ki surprise jhel ke bhi jeet sakte ho.'
            },
            lose: {
              en: 'Ravi: "The dark horse surprised us. But next time, we\'ll be ready for anything."',
              hi: 'Ravi: "Dark horse ne hume surprise kiya. Paragli baar hum har cheez ke liye ready honge."'
            }
          },
          roasts: {
            en: [
              'The Dark Horses? The only dark thing here is your future in cricket ★★★',
              'Bro your batting is so dim even darkness is confused ★★★',
              'That was the most brightly lit failure ★★★',
              'The only horse here is the one that bolted from your batting ★★★',
              'Dark Horses? You\'re about as surprising as a sunny day ★★★'
            ],
            hi: [
              'The Dark Horses? Yahan pe sirf tera cricket future dark hai ★★★',
              'Bhai teri batting itni dim hai ki andhera bhi confuse ho raha hai ★★★',
              'Ye sabse roshni bhari fail thi ★★★',
              'Yahan pe sirf ek horse hai jo teri batting se bhaag gaya ★★★',
              'Dark Horses? Tu dhup ke din jaisa predictable hai ★★★'
            ]
          }
        },
        {
          oppName: 'The Dynasty',
          oppCountry: 'West Indies',
          oppPlayers: [
            { name: 'Brian L.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Chris G.', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Shivnarine C.', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Dwayne B.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Kieron P.', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Carl H.', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Curtly A.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Courtney W.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Malcolm M.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Roston C.', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Carlos B.', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "The Dynasty — a team of legends. Their bloodline runs deep in cricket. Can we dethrone a dynasty?"',
              hi: 'Ravi: "The Dynasty — legends ki team. Inka khoon cricket mein gehra hai. Kya hum dynasty ko hata sakte hain?"'
            },
            win: {
              en: 'The dynasty falls. Your name joins the annals of cricket history. The dynasty ends tonight.',
              hi: 'Dynasty gir gaya. Tera naam cricket itihaas mein jud gaya. Dynasty aaj raat khatam.'
            },
            lose: {
              en: 'Ravi: "The dynasty was too strong. But every dynasty eventually falls."',
              hi: 'Ravi: "Dynasty bahut mazboot thi. Par har dynasty kabhi na kabhi girti hai."'
            }
          },
          roasts: {
            en: [
              'The Dynasty? The only dynasty here is the dynasty of failures ★★★',
              'Bro your batting legacy is as dead as a dodo ★★★',
              'That was the most un-dynastic performance ★★★',
              'The only ruling you\'re doing is ruling the loss column ★★★',
              'Dynasty? You can\'t even spell dynasty without dying ★★★'
            ],
            hi: [
              'The Dynasty? Yahan pe sirf failon ki dynasty hai ★★★',
              'Bhai teri batting legacy dodo jaisi mar gayi hai ★★★',
              'Ye sabse un-dynastic performance thi ★★★',
              'Tu sirf haar column pe rule kar raha hai ★★★',
              'Dynasty? Tu dynasty bhi nahi likh sakta bina mar ke ★★★'
            ]
          }
        },
        {
          oppName: 'THE FINAL — Mirror Match',
          oppCountry: 'India',
          oppPlayers: [
            { name: 'The Rival', role: 'batter', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Shadow', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Echo', role: 'batter', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Mirror', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Phantom', role: 'all', battingStyle: 'aggressive', bowlingStyle: 'balanced' },
            { name: 'Ghost', role: 'batter', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Razor', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Fang', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' },
            { name: 'Venom', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'balanced' },
            { name: 'Wraith', role: 'all', battingStyle: 'balanced', bowlingStyle: 'balanced' },
            { name: 'Spectre', role: 'bowler', battingStyle: 'defensive', bowlingStyle: 'aggressive' }
          ],
          narrative: {
            pre: {
              en: 'Ravi: "This is it. THE FINAL. A mirror match — they play exactly like you. The only way to win is to be better than yourself."',
              hi: 'Ravi: "Ye wohi hai. THE FINAL. Mirror match — ye bilkul tumhari tarah khelte hain. Jeetne ka ek hi tareeka hai — apne aap se behtar hona."'
            },
            win: {
              en: 'YOU DID IT! National Champions! From the gully to the top of the nation. Ravi is crying. Your parents are crying. The whole country is celebrating. You are THE CHAMPION!',
              hi: 'KAR DIYA! National Champion! Gully se desh ke top tak. Ravi ro raha hai. Maa-baap ro rahe hain. Poora desh celebrate kar raha hai. Tu CHAMPION hai!'
            },
            lose: {
              en: 'Ravi: "So close. But you know what? We came from nothing. And we\'ll be back. This isn\'t the end. This is just the beginning."',
              hi: 'Ravi: "Itna paas! Par pata hai kya? Hum kuch nahi the. Aur hum wapas ayenge. Ye khatam nahi hua. Ye to bas shuruaat hai."'
            }
          },
          roasts: {
            en: [
              'Mirror Match? The mirror broke looking at your batting ★★★',
              'Bro you\'re so bad even your mirror image refuses to play ★★★',
              'That was the most one-sided mirror match ever ★★★',
              'The only reflection here is the reflection of defeat ★★★',
              'You call that a mirror match? The mirror wants a divorce ★★★'
            ],
            hi: [
              'Mirror Match? Aaina toot gaya teri batting dekh ke ★★★',
              'Bhai tu itna bura hai ki tera aaine wala bhi khelna nahi chahta ★★★',
              'Ye sabse ek-sided mirror match thi jo kabhi hui ★★★',
              'Yahan pe sirf ek reflection hai aur wo haar ka reflection hai ★★★',
              'Tu ise mirror match bolta hai? Aaina divorce chahta hai ★★★'
            ]
          }
        }
      ]
    }
  ]
};
