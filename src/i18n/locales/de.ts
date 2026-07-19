import type { Translation } from "./en"
import { APP_VERSION } from "../../config/appVersion"

export const de: Translation = {
    roles: {
        new: {
            title: "Neu entdeckt",
            description: "Dieses Album möchte ich erst kennenlernen.",
        },
        growing: {
            title: "Wächst noch",
            description: "Mit jedem Hören entdecke ich mehr.",
        },
        "comfort-food": {
            title: "Comfort Food",
            description: "Hierhin komme ich immer wieder zurück.",
        },
        classic: {
            title: "Klassiker",
            description:
                "Dieses Album hat mich über längere Zeit geprägt und bleibt Teil meiner musikalischen Biografie.",
        },
        admire: {
            title: "Bewunderung",
            description:
                "Ich erkenne seine musikalische Größe an, auch wenn ich nicht mehr selbstverständlich dazu greife.",
        },
        archive: {
            title: "Archiv",
            description:
                "Dieses Album darf im Moment ruhen, ohne aus meiner Geschichte zu verschwinden.",
        },
    },

    roleEmpty: {
        new: "Noch wartet kein Album darauf, entdeckt zu werden.",
        growing:
            "Hier wächst noch nichts — aber jede Sammlung fängt klein an.",
        "comfort-food": "Noch gibt es keinen Ort, an den du immer wieder zurückkehrst.",
        classic: "Noch begleitet dich kein Album als Klassiker.",
        admire: "Noch staunst du vor keinem Album in Bewunderung.",
        archive:
            "Das Archiv ist noch leer — manche Alben brauchen erst Zeit.",
        default: "Diese Rolle wartet noch auf ihr erstes Album.",
    },

    welcome: {
        title: "Rotation",
        subtitle:
            "Musik verändert sich nicht. Deine Beziehung zu ihr schon.",
        description:
            "Rotation hilft dir dabei, Alben bewusst zu hören, sie wiederzuentdecken und deine persönliche Bibliothek über viele Jahre wachsen zu lassen.",
        cta: "Meine Bibliothek beginnen",
        version: `Version ${APP_VERSION}`,
    },

    header: {
        title: "Rotation",
    },

    home: {
        suggestFocusAlbum: "Neues Fokusalbum vorschlagen",
        discoverAlbum: "Neues Album entdecken",
        syncingLibrary: "Bibliothek wird synchronisiert…",
        libraryUnavailable: "Die Server-Bibliothek ist nicht verfügbar",
        retryLibrary: "Bibliothek neu laden",
    },

    emptyLibrary: {
        title: "Noch keine Alben",
        description:
            "Scanne zuerst deinen Musikordner und erfasse anschließend ein gefundenes Album.",
        cta: "Zur Bindings-Seite",
    },

    focusAlbum: {
        label: "Fokusalbum",
        roleSince: "Aktuelle Rolle seit",
        listenCountLabel: "Hörsessions",
        lastListenedLabel: "Zuletzt gehört",
        noListenSession: "Noch keine Hörsession",
        listened: "Gehört",
        timeline: "Albumhistorie",
        emptyTitle: "Noch kein Fokusalbum ausgewählt",
        emptyDescription: "Lass dir ein zufälliges Album aus deiner aktiven Rotation vorschlagen.",
        needsRotation: "Aktiviere zuerst eine Rotation, um daraus ein Fokusalbum auszuwählen.",
    },

    albumStory: {
        why: "Warum",
        when: "Wann",
    },

    albumDetail: {
        kicker: "Albumreise",
        back: "← Zurück zur Bibliothek",
        loading: "Albumdetails werden geladen…",
        loadingRelated: "Zugehörige Albumhistorie wird geladen…",
        notFoundTitle: "Album nicht gefunden",
        notFound: (id: string) => `Es ist kein Album mit der ID ${id} verfügbar.`,
        unknownYear: "Erscheinungsjahr unbekannt",
        listened: "Gehört",
        edit: "Album bearbeiten",
        partialTitle: "Einige zugehörige Informationen sind nicht verfügbar.",
        partialDescription: "Die bereits verfügbaren Albumdaten bleiben sichtbar.",
        story: { title: "Meine Geschichte", memory: "Erinnerung", empty: "Für dieses Album ist noch keine persönliche Geschichte festgehalten." },
        roleHistory: { title: "Rollenverlauf", empty: "Noch keine Rollenwechsel dokumentiert.", source: { coach: "Album-Coach", reflection: "Reflexion", archive: "Archiv-Workflow" } },
        listening: { title: "Hörsessions", summary: (count: number) => `${count} dokumentierte ${count === 1 ? "Session" : "Sessions"}`, empty: "Für dieses Album ist noch keine Hörsession dokumentiert." },
        reflections: {
            title: "Reflexionen", empty: "Für dieses Album gibt es keine offenen Reflexionen.",
            rules: { "new-after-listens": "Entdeckung überprüfen", "growing-for-a-while": "Entwicklung überprüfen", "comfort-not-recent": "Vertrautes Album wiederhören", "archive-return-candidate": "Mögliche Rückkehr aus dem Archiv", "never-heard-dormant": "Noch ungehört", "rotation-absent-dormant": "Außerhalb der Rotation" },
            state: { open: "Offen", snoozed: "Zurückgestellt", resolved: "Erledigt", dismissed: "Verworfen" },
        },
        rotation: { title: "Rotation", current: (name: string) => `Aktuell in „${name}“ enthalten.`, history: (count: number) => `${count} frühere ${count === 1 ? "Rotation" : "Rotationen"}`, empty: "Dieses Album gehört zu keiner aktuellen oder dokumentierten früheren Rotation." },
        binding: { title: "Musikordner", stateLabel: "Binding", folder: "Ordner", availability: "Verfügbarkeit", missing: "Der verknüpfte Ordner fehlt derzeit.", empty: "Für dieses Album ist kein Musikordner-Binding bestätigt.", states: { proposed: "Vorgeschlagen", confirmed: "Bestätigt", missing: "Fehlt" } },
    },

    albumSources: {
        title: "Externe Quellen",
        description: "Starte die Suche nur, wenn du gespeicherte Verweise prüfen oder korrigieren möchtest. Vor dem Speichern wird nichts ersetzt.",
        empty: "Für dieses Album ist keine externe Quelle gespeichert.",
        provider: "Anbieter", url: "Kanonische URL", remove: "Entfernen", matches: "MusicBrainz-Treffer prüfen",
        noMatches: "Starte eine ausdrückliche Suche, um Verweise zu finden oder zu ersetzen.", find: "Externe Quellen finden", working: "Suche läuft…", save: "Geprüfte Quellen speichern", saved: "Die geprüften Quellen wurden gespeichert.", error: "Die Quellenaktion ist fehlgeschlagen.",
        providers: { musicbrainz: "MusicBrainz", wikipedia: "Wikipedia", wikidata: "Wikidata" },
        manage: "Externe Quellen verwalten",
    },

    externalSources: {
        kicker: "Weiterlesen", title: "Externe Quellen", description: "Von Rotation gespeicherte, geprüfte Ziele. Sie öffnen sich auf der Website des Anbieters.",
        providers: { musicbrainz: "MusicBrainz", wikipedia: "Wikipedia", wikidata: "Wikidata" },
        actions: { musicbrainz: "Auf MusicBrainz ansehen", wikipedia: "Auf Wikipedia lesen", wikidata: "Auf Wikidata ansehen" },
    },

    acquisitionReasons: {
        artist: "Künstler",
        "friend-recommendation": "Empfehlung",
        "specific-song": "Song",
        concert: "Konzert",
        review: "Rezension",
        "record-store": "Plattenladen",
        gift: "Geschenk",
        digital: "iTunes / Online",
        "random-discovery": "Zufall",
        "life-phase": "Lebensphase",
        completion: "Komplettierung",
        "collection-essential": "Gehört in die Sammlung",
        unknown: "Ich erinnere mich nicht",
        other: "Sonstiges",
    },

    lifePhases: {
        childhood: "Kindheit",
        school: "Schulzeit",
        studies: "Studium",
        "first-apartment": "Erste Wohnung",
        relationship: "Beziehung",
        breakup: "Trennung",
        work: "Beruf",
        travel: "Reise",
        family: "Familie",
        current: "Aktuell",
        unknown: "Ich erinnere mich nicht",
        other: "Andere",
    },

    dashboard: {
        title: "Dashboard",
        subtitle: "Was gerade Aufmerksamkeit verdient.",
        nextQuestion: "Nächste Frage",
        insights: "Insights",
        roleOverview: "Rollenübersicht",
    },

    insightsPage: {
        kicker: "Ein ruhiger Blick auf deine Sammlung",
        title: "Insights",
        description: "Fragen, Beobachtungen und die Rollen, die deine Alben gerade einnehmen.",
    },

    insights: {
        buildingLibrary: {
            title: "Deine Sammlung entsteht gerade",
            description:
                "Mit ein paar weiteren Alben kann Rotation erste Muster in deiner Sammlung erkennen.",
        },
        discoveryPhase: {
            title: "Du bist gerade in einer Entdeckungsphase",
            description:
                "Viele Alben in deiner Sammlung wollen noch wachsen oder erst kennengelernt werden.",
        },
        archiveHeavy: {
            title: "Ein spürbarer Teil deiner Sammlung ruht",
            description:
                "Das Archiv hat Gewicht bekommen. Vielleicht ist darin bald wieder ein Kandidat für Wiederentdeckung.",
        },
        comfortHeavy: {
            title: "Deine Sammlung sucht gerade Vertrautheit",
            description:
                "Comfort-Food-Alben nehmen gerade viel Raum ein. Das kann eine sehr stabile Hörphase sein.",
        },
        classicCore: {
            title: "Deine Sammlung hat einen klaren Klassiker-Kern",
            description:
                "Ein Teil deiner Sammlung wirkt inzwischen dauerhaft prägend.",
        },
        editorialIntro: "Einige belegbare Beobachtungen – niemals eine Bewertung.",
        loading: "Rotation blickt behutsam durch deine Hörgeschichte…",
        unavailable: "Die tieferen Insights sind gerade nicht erreichbar.",
        retry: "Erneut versuchen",
        why: "Warum sehe ich das?",
        supportedEvidence: "Ein erkennbares Muster",
        strongEvidence: "Ein gut belegtes Muster",
        memoryPrompt: {
            eyebrow: "Eine offene Erinnerung",
            acquisitionQuestion: "Fällt dir noch ein, wie dieses Album zu dir kam?",
            lifePhaseQuestion: "Fällt dir noch ein, in welcher Lebensphase dieses Album zu dir kam?",
            openAlbum: "Albumgeschichte ergänzen",
        },
        narratives: {
            discoveryRising:{title:"Entdeckung ist nach vorn gerückt",description:"Zuletzt entfiel mehr Hörzeit auf neue oder noch wachsende Alben als im Zeitraum davor."},
            familiarityRising:{title:"Vertraute Alben sind näher gerückt",description:"Zuletzt bist du häufiger zu Comfort Food und Klassikern zurückgekehrt als im Zeitraum davor."},
            listeningBalanced:{title:"Entdeckung und Vertrautheit teilen sich den Raum",description:"Zuletzt war ähnlich viel Platz für wachsende Beziehungen und vertraute Alben."},
            dormantLibrary:{title:"Ein stiller Teil der Library ruht",description:"Eine bedeutsame Gruppe von Alben wurde länger nicht gehört und ist auch nicht Teil der aktuellen Rotation."},
            rediscoveryMoments:{title:"Etwas lange Ruhendes ist zurückgekehrt",description:"Mehrere aktuelle Hörsessions folgten auf eine Pause von mindestens sechs Monaten."},
            rolesInMotion:{title:"Albumbeziehungen waren in Bewegung",description:"Mehrere bereits eingeordnete Alben haben in den letzten Monaten eine neue Rolle erhalten."},
            rotationEvolving:{title:"Die Rotation hat ihre Gesellschaft verändert",description:"Gegenüber dem vorherigen Zyklus sind spürbar Alben hinzugekommen und zurückgetreten."},
            recurringArtist:{title:"{subject} kehrt immer wieder",description:"Die letzten Hörsessions führten durch mehrere Alben von {subject} und bilden damit einen wiederkehrenden Künstlerfaden."},
            listeningEra:{title:"Die {subject} sind gerade im Raum",description:"Alben aus den {subject} sind in den letzten Hörsessions wiederholt aufgetaucht."},
            lifePhaseReturn:{title:"Musik aus der Lebensphase {subject} ist wieder da",description:"Mehrere aktuelle Hörsessions gehören zu Alben, die du der Lebensphase {subject} zugeordnet hast."},
            acquisitionThread:{title:"Ein gemeinsamer Ursprung klingt nach",description:"Mehrere aktuelle Hörsessions gehören zu Alben mit dem Erwerbsgrund „{subject}“."},
        },
        evidence: {
            recentListens:"{count} Hörsessions im aktuellen 90-Tage-Fenster",previousListens:"{count} Hörsessions im vorherigen 90-Tage-Fenster",recentDiscoveryListens:"{count} aktuelle Sessions galten Entdeckung oder Wachstum",previousDiscoveryListens:"{count} frühere Sessions galten Entdeckung oder Wachstum",recentFamiliarListens:"{count} aktuelle Sessions galten Comfort Food oder Klassikern",previousFamiliarListens:"{count} frühere Sessions galten Comfort Food oder Klassikern",dormantAlbums:"{count} Alben ruhten außerhalb der aktiven Rotation",libraryAlbums:"{count} Alben bilden die aktuelle Library",rediscoveredListens:"{count} Sessions kehrten nach mindestens 180 Tagen zurück",recentRoleTransitions:"{count} bestehende Albumrollen änderten sich in 180 Tagen",rotationEntering:"{count} Alben kamen in die aktuelle Rotation",rotationLeaving:"{count} Alben verließen die vorherige Rotation",rotationUnchanged:"{count} Alben blieben über beide Rotationen erhalten",
            artistListens:"{count} aktuelle Hörsessions gehörten zu diesem Künstler",artistAlbums:"{count} verschiedene Alben tragen den Künstlerfaden",knownYearAlbums:"{count} Library-Alben besitzen ein nutzbares Erscheinungsjahr",eraListens:"{count} aktuelle Hörsessions gehörten zu diesem Jahrzehnt",eraAlbums:"{count} Library-Alben stammen aus diesem Jahrzehnt",annotatedAlbums:"{count} Alben besitzen strukturierte Felder zur persönlichen Geschichte",personalThemeListens:"{count} aktuelle Hörsessions teilen dieses strukturierte biografische Thema",
        },
        building: {
            library:{title:"Die Library nimmt noch Gestalt an",description:"Einige weitere Alben sind nötig, bevor Rotation ein belastbares Muster beschreiben kann."},
            listeningComparison:{title:"Ein Hörvergleich wächst heran",description:"Sobald beide 90-Tage-Fenster mindestens fünf Sessions enthalten, kann Rotation Veränderungen im Hörschwerpunkt beschreiben."},
            rotationComparison:{title:"Eine zweite Rotation schafft Perspektive",description:"Sobald eine vorherige angenommene Rotation existiert, kann Rotation beschreiben, was kam, blieb oder ging."},
        },
    },

    reflection: {
        inbox: { label:"Reflexions-Inbox",loading:"Rotation sucht nach bedeutsamen Momenten…",unavailable:"Die Reflexions-Inbox ist gerade nicht erreichbar.",retry:"Erneut versuchen",evidence:"{listens} Hörsessions · {days} Tage in dieser Rolle",later30:"Später · 30 Tage",later90:"90 Tage ruhen lassen",dismiss:"Für diesen Anlass nicht mehr fragen" },
        empty: {
            label: "Reflexion",
            title: "Gerade keine offene Frage",
            description: "Deine Sammlung wirkt im Moment stimmig. Wenn ein Album wieder Aufmerksamkeit braucht, fragt Rotation hier nach.",
        },
        newAfterListens: {
            title: "Vielleicht ist dieses Album nicht mehr neu",
            description:
                "Du hast es inzwischen mehrmals gehört. Vielleicht hat es heute schon eine klarere Rolle in deiner Rotation.",
            action: "Neu einordnen",
        },
        growingForAWhile: {
            title: "Wächst dieses Album noch?",
            description:
                "Dieses Album liegt schon eine Weile in der Rolle 'Wächst noch'. Ein neuer Blick kann zeigen, ob es dort noch richtig aufgehoben ist.",
            action: "Neu einordnen",
        },
        comfortNotRecent: {
            title: "Ist das noch Comfort Food?",
            description:
                "Dieses Album war vertraut, wurde aber länger nicht gehört. Vielleicht ist seine Rolle heute eine andere.",
            action: "Neu einordnen",
        },
        archiveReturnCandidate: {
            title: "Kandidat für Wiederentdeckung?",
            description:
                "Dieses Album ruht schon länger im Archiv. Vielleicht lohnt sich ein vorsichtiger Blick darauf, ob es heute wieder in deine Rotation passt.",
            action: "Wiederentdeckung prüfen",
        },
        neverHeardDormant: { title:"Möchtest du diesem Album eine erste Chance geben?",description:"Es ist schon länger in deiner Sammlung, ohne dass eine Hörsession vermerkt wurde.",action:"Jetzt reflektieren" },
        rotationAbsentDormant: { title:"Könnte dieses Album in deine Rotation zurückkehren?",description:"Es war in den letzten Rotationen nicht vertreten und könnte einen bewussten Blick verdienen.",action:"Jetzt reflektieren" },
        later: "Später",
    },

    coach: {
        intro: {
            line1: "Jedes Album spielt im Laufe der Zeit eine andere Rolle.",
            line2: "Manche begleiten uns über Jahre.",
            line3: "Andere wachsen langsam. Wieder andere finden irgendwann vielleicht ihren Platz im Archiv.",
            cta: (albumTitle: string) =>
                `Finde gemeinsam heraus, welche Rolle ${albumTitle} heute für dich spielt.`,
            start: "Los geht's",
        },
        snapshot: {
            step: "Schritt 2 von 3 · Momentaufnahme",
            title: "Wie ist deine Beziehung zu diesem Album heute?",
            description: "Ein paar kompakte Signale reichen. Es gibt keine richtigen Antworten und noch wird nichts gespeichert.",
            exposure: { label:"Wie oft hast du es bewusst gehört?",options:{ none:"Noch gar nicht","up-to-three":"Bis zu dreimal","more-than-three":"Mehr als dreimal" } },
            explore: { label:"Möchtest du diesem Album eine echte Chance geben?" },
            yesNo: { yes:"Ja",no:"Nein" },
            connection: "Wie stark ist deine persönliche Verbindung?",
            connectionOptions: { "1":"1 · Gering","2":"2","3":"3","4":"4","5":"5 · Sehr stark" },
            returnBehavior: { label:"Wie oft kehrst du bewusst zurück?",options:{ regularly:"Regelmäßig",occasionally:"Gelegentlich",rarely:"Selten",never:"Nie" } },
            ownership: { label:"Wie lange gehört es zu deiner Sammlung?",options:{ "under-six-months":"Unter 6 Monaten","six-months-to-two-years":"6 Monate–2 Jahre","two-to-ten-years":"2–10 Jahre","over-ten-years":"Über 10 Jahre" } },
            binary: { formative:"Hat es deinen Geschmack oder deine musikalische Biografie geprägt?",comfort:"Ist die Rückkehr vor allem vertraut und wohltuend?",continuingDiscovery:"Offenbart, überrascht oder fordert es dich noch?" },
            conclusion: { label:"Falls keine aktive Rolle klar ist: Was passt am ehesten?",options:{ "keep-exploring":"Ich möchte es noch besser kennenlernen","personally-valued":"Ich schätze es, obwohl ich es selten höre","relationship-complete":"Es hatte seine Zeit; die Beziehung ist abgeschlossen","canonical-but-not-personal":"Ich verstehe seine Bedeutung, aber es ist nicht meines","no-connection":"Es hat mich trotz mehrerer Versuche nie erreicht" } },
            validation: "Bitte beantworte die für deinen Weg relevanten Punkte.",continue:"Empfehlung anzeigen",
        },
        questions: {
            heardThreeTimes: {
                title: "Hast du dieses Album mindestens dreimal bewusst gehört?",
                description:
                    "Erst nach mehreren Durchgängen entsteht meist ein belastbarer Eindruck.",
            },
            wantsToGiveChance: {
                title: "Möchtest du diesem Album noch eine echte Chance geben?",
                description:
                    "Ja hält es als Neu entdeckt in deiner Rotation. Nein legt es ins Archiv, ohne dass du es dir erst mehrfach anhören musst.",
            },
            stillReturningConsciously: {
                title: "Kehrst du heute noch bewusst zu diesem Album zurück?",
                description:
                    "Damit unterscheiden wir eine aktive von einer momentan ruhenden Beziehung.",
            },
            shapedTasteLongterm: {
                title:
                    "Hat dieses Album dich über längere Zeit begleitet oder deinen Musikgeschmack geprägt?",
                description:
                    "Persönliche Klassiker bleiben auch dann bestehen, wenn sie gerade weniger häufig gespielt werden.",
            },
            comfortAlbum: {
                title:
                    "Greifst du manchmal ganz automatisch zu diesem Album, ohne lange über deine Musikauswahl nachzudenken?",
                description:
                    "Comfort-Food-Alben fühlen sich vertraut an und begleiten dich zuverlässig.",
            },
            comfortDefinesRelationshipToday: {
                title:
                    "Beschreibt die vertraute, mühelose Rückkehr deine heutige Beziehung stärker als seine langfristige Prägung?",
                description:
                    "Ja führt zu Comfort Food; Nein gewichtet die biografische Prägung als Classic stärker.",
            },
            surprisedOnLastListen: {
                title:
                    "Hat dich das Album beim letzten bewussten Hören überrascht oder herausgefordert?",
                description:
                    "Manche Alben wachsen mit jedem Hören weiter.",
            },
            musicallyValued: {
                title: "Schätzt du es musikalisch weiterhin sehr?",
                description:
                    "Hohe musikalische Wertschätzung reicht für Bewunderung, auch ohne aktive Rückkehr.",
            },
        },
        result: {
            step: "Schritt 3 von 3 · Empfehlung",
            ourRecommendation: "Unsere Empfehlung",
            roleAssigned: (roleTitle: string) =>
                `Die Rolle "${roleTitle}" passt gut zu diesem Album.`,
            chooseRole:"Endgültige Rolle wählen",archiveReason:"Was beschreibt die Archiventscheidung am besten?",back:"Zurück zur Momentaufnahme",accept:"Rolle bestätigen",
        },
        reasons: { "new-exploration":"Du kennst es noch nicht vollständig und möchtest ihm weiteren Raum geben.","formative-classic":"Deine starke persönliche Verbindung und prägende Geschichte sprechen für einen persönlichen Klassiker.","familiar-return":"Die vertraute, verlässliche Rückkehr bestimmt eure heutige Beziehung.","continuing-discovery":"Das Album gibt dir weiterhin etwas zu entdecken.","personal-admiration":"Du schätzt es persönlich, auch ohne häufige Rückkehr.","declined-discovery":"Du möchtest diesem noch unvertrauten Album gerade keinen weiteren Raum geben.","completed-relationship":"Das Album hatte seine Zeit, aber diese Beziehung wirkt heute abgeschlossen.","canonical-distance":"Du erkennst seine Bedeutung an, ohne eine persönliche aktive Beziehung dazu zu haben.","no-connection":"Du hast ihm genug Raum gegeben, aber daraus entstand keine bleibende Verbindung." },
        archiveReasons: { "not-interested-in-discovery":{title:"Keine weitere Entdeckung",description:"Ich möchte diesem noch unvertrauten Album gerade keinen weiteren Raum geben."},"relationship-complete":{title:"Beziehung abgeschlossen",description:"Es hatte seinen Platz in meinem Leben, aber diese Phase ist vorbei."},"canonical-but-not-personal":{title:"Bedeutend, aber nicht meines",description:"Ich erkenne seine Bedeutung ohne persönliche Bindung an."},"no-connection":{title:"Keine Verbindung",description:"Es hat mich trotz ausreichender Aufmerksamkeit nie erreicht."} },
        orphanPrompt: {
            title: "Ungebundene Alben warten auf dich",
            description: "Im Musikordner wurden Einträge gefunden, die du auf der Bindings-Seite prüfen und erfassen kannst.",
            dismiss: "Nicht jetzt",
            capture: "Bindings öffnen",
        },
    },

    archive: {
        protection: {
            questions: {
                hasBiographicPlace: {
                    title:
                        "Hat dieses Album einen dauerhaften Platz in deiner musikalischen Biografie?",
                    description:
                        "Ein persönlicher Klassiker kann aktuell ruhen und trotzdem ein Klassiker bleiben.",
                },
                stillReturningConsciously: {
                    title:
                        "Kehrst du heute noch bewusst zu diesem Album zurück?",
                    description:
                        "Wenn du noch aktiv dorthin greifst, ist es vielleicht Bewunderung statt Archiv.",
                },
                musicallyValued: {
                    title: "Schätzt du es musikalisch weiterhin sehr?",
                    description:
                        "Hohe musikalische Wertschätzung reicht für Bewunderung, auch ohne aktive Rückkehr.",
                },
            },
            keepInArchive: "Dieses Album darf ruhen",
            protectFromArchive: "Dieses Album bleibt geschützt",
            accept: "Entscheidung übernehmen",
            cancel: "Abbrechen",
        },
        return: {
            questions: {
                heardLastSixMonths: {
                    title:
                        "Hast du dieses Album in den letzten 6 Monaten mindestens einmal bewusst gehört?",
                    description:
                        "Wenn es noch aktiv auftaucht, darf es im Archiv weiter ruhig bleiben.",
                },
                remembersMoment: {
                    title:
                        "Erinnerst du dich spontan an einen Song, ein Riff, eine Textzeile oder einen besonderen Moment?",
                    description:
                        "Wiederentdeckung beginnt oft mit einem kleinen, klaren Erinnerungsfunken.",
                },
                wouldDefendAlbum: {
                    title:
                        'Würdest du jemandem widersprechen, der sagt: "Das Album ist eigentlich ziemlich durchschnittlich"?',
                    description:
                        "Wenn du es verteidigen würdest, ist es vielleicht ein Klassiker.",
                },
                reason: {
                    title: "Warum hast du dieses Album damals gekauft?",
                    description:
                        "Die Antwort verändert nicht allein die Rolle, hilft aber beim Erinnern.",
                    options: {
                        recommendation: "Empfehlung oder Jahresliste",
                        artist: "Band oder Künstler geliebt",
                        curiosity: "Neugier, Cover oder Impulskauf",
                    },
                },
                fitsCurrentMood: {
                    title:
                        "Passt dieses Album zu deiner aktuellen Lebensphase oder Hörstimmung?",
                    description:
                        "Nicht jedes gute Album muss gerade zurück in die Rotation.",
                },
                listeningNeed: {
                    title:
                        "Suchst du heute eher Vertrautheit oder Entdeckung?",
                    description:
                        "Vertrautheit führt eher zum Klassiker, Entdeckung eher zu 'Wächst noch'.",
                    options: {
                        familiarity: "Vertrautheit",
                        discovery: "Entdeckung",
                    },
                },
            },
            allowReturn: "Dieses Album darf zurückkehren",
            keepArchived: "Dieses Album bleibt im Archiv",
            accept: "Entscheidung übernehmen",
            later: "Später",
        },
    },

    timeline: {
        title: "Albumhistorie",
        header: "Die bisher dokumentierte Geschichte dieses Albums.",
        noEvents: "Noch keine dokumentierten Ereignisse.",
        latestEvents: "Letzte Ereignisse",
        firstSession: "Erste Hörsession",
        lastSession: "Letzte Hörsession",
        sessionN: (n: number) => `Hörsession ${n}`,
        roleAssignedBy: (source: string) => `Eingestuft via ${source}.`,
        storyAdded: "Geschichte hinzugefügt",
        storyAcquiredBecause: (reason: string) => `Gekauft wegen: ${reason}`,
        storyLinked: "Eine persönliche Geschichte wurde verknüpft.",
        lastListened: "Zuletzt gehört",
        listenCountDescription: (count: number) =>
            count === 1
                ? "Die erste dokumentierte Hörsession."
                : `${count} dokumentierte Hörsessions insgesamt.`,
        sessionDescription: (current: number, total: number) =>
            current === 0
                ? `Aktuellste dokumentierte Session (${total} insgesamt).`
                : `Session ${total - current} von ${total}.`,
        coach: "Album Coach",
        reflection: "Reflexion",
        archiveWorkflow: "Archiv-Workflow",
        sourceDefault: "Rotation",
    },

    journal: {
        title: "Hörjournal",
        kicker: "Ein Gedanke zu dieser Hörsession",
        addThought: "Gedanken hinzufügen",
        dismiss: "Nicht jetzt",
        note: "Was ist bei dir geblieben?",
        placeholder: "Ein Klang, ein Gefühl, ein Moment …",
        mood: "Stimmung",
        context: "Kontext",
        moods: { calm:"Ruhig", energized:"Energiegeladen", melancholic:"Melancholisch", curious:"Neugierig", nostalgic:"Nostalgisch" },
        contexts: { focused:"Bewusst gehört", background:"Nebenbei", "on-the-go":"Unterwegs", evening:"Abends", shared:"Gemeinsam gehört" },
        save: "Gedanken speichern",
        cancel: "Abbrechen",
        delete: "Notiz entfernen",
        edit: "Gedanken bearbeiten",
        previous: "Frühere Hörnotizen",
        saveError: "Dein Text ist noch da. Speichern fehlgeschlagen – bitte erneut versuchen.",
        inferredRole: (role:string) => `Rolle zu diesem Zeitpunkt (abgeleitet): ${role}`,
    },

    library: {
        title: "Bibliothek",
        views: {
            all: "Alle",
            byRole: "Nach Rolle",
            perspectives: "Perspektiven",
            artist: "Künstler",
            year: "Jahr",
            lastListened: "Hörsession",
            roleChange: "Einordnung",
        },
        recency: {
            today: "Heute",
            thisWeek: "Diese Woche",
            thisMonth: "Dieser Monat",
            thisYear: "Dieses Jahr",
            older: "Länger her",
            never: "Noch nicht gehört",
        },
        unknownArtist: "Unbekannt",
        unknownYear: "Unbekanntes Jahr",
        noRoleChange: "Noch keine Einordnung",
        controls: {
            label: "Bibliothek durchsuchen und filtern",
            searchLabel: "Suche",
            searchPlaceholder: "Titel, Künstler oder Albumgeschichte",
            resultCount: (visible: number, total: number) => `${visible} von ${total} Alben`,
            role: "Rolle",
            allRoles: "Alle Rollen",
            noRole: "Keine Rolle zugewiesen",
            archive: "Status",
            allAlbums: "Alle Alben",
            activeOnly: "Nur aktive Alben",
            archivedOnly: "Nur Archiv",
            listening: "Hörstatus",
            anyListening: "Alle Hörstände",
            neverListened: "Noch nie gehört",
            yearFrom: "Jahr von",
            yearTo: "Jahr bis",
            quickViews: "Schnellansichten",
            recentlyArchived: "Kürzlich archiviert",
            neverListenedRule: "Alben ohne dokumentierte Hörsession und mit Höranzahl 0.",
            recentlyArchivedRule: "Alben, deren aktuelle Rolle Archiv ist und die innerhalb der letzten 30 Tage archiviert wurden.",
            reset: "Filter zurücksetzen",
            noResults: "Keine Alben entsprechen der aktuellen Suche und den Filtern.",
        },
        pagination: {
            label: "Bibliotheksseiten",
            previous: "Zurück",
            next: "Weiter",
            status: (page: number, total: number) => `Seite ${page} von ${total}`,
        },
    },

    albumCard: {
        archiveLabel: "Archiv",
        listened: "Gehört",
        listenCount: (count: number) => `${count}x gehört`,
        setFocus: "Fokus setzen",
        edit: "Album bearbeiten",
        startCoach: "Rolle mit Album Coach bestimmen",
        archive: "Im Archiv ablegen",
        reconsider: "Wiederentdeckung prüfen",
        delete: "Album löschen",
        bound: "Verbunden",
        unbound: "Nicht verbunden",
        boundTooltip: (path: string) => `Dateien unter: ${path}`,
        missingFolderTooltip: (path: string) => `Ordner fehlt: ${path}`,
    },

    deleteDialog: {
        title: "Album wirklich löschen?",
        description:
            "Dieses Album wird dauerhaft aus deiner Bibliothek entfernt. Diese Aktion kann nicht rückgängig gemacht werden.",
        confirm: "Ja, löschen",
        cancel: "Abbrechen",
    },

    editDialog: {
        retryCover: "Cover erneut suchen",
        coverResolution: {
            cached: "Cover wurde gefunden und aktualisiert.",
            localNotFound: "Kein lokales Artwork gefunden.",
            localInvalid: "Das gefundene Artwork ist beschädigt oder ungültig.",
            remoteUnavailable: "Der externe Cover-Anbieter ist vorübergehend nicht verfügbar.",
            notFound: "Es konnte kein Cover gefunden werden.",
        },
        startCoach: "Rolle mit Album Coach bestimmen",
        changeRole: "Rolle mit Album Coach ändern",
        title: "Album-Metadaten bearbeiten",
        subtitle: "Korrigiere Metadaten und Albumgeschichte oder bestimme die Rolle neu.",
        titleLabel: "Titel",
        artistLabel: "Künstler",
        yearLabel: "Jahr",
        coverUrlLabel: "Cover-URL",
        resetCover: "Cover zurücksetzen",
        save: "Speichern",
        cancel: "Abbrechen",
        storyTitle: "Albumgeschichte",
        acquiredBecauseLabel: "Wieso hast du dieses Album erworben?",
        lifePhaseLabel: "Welcher Lebensphase gehört es an?",
        memoryNotePlaceholder:
            "Was erinnerst du, wenn du dieses Album hörst?",
        memoryNoteLabel: "Erinnerungsnotiz",
        deleteStory: "Geschichte löschen",
        loadCover: "Laden",
        coverLabelUpload: "Eigenes Cover",
        coverLabelAlternative: "Alternatives Cover",
        coverLabelUrl: "URL-Override",
        selectPlaceholder: "Bitte wählen...",
        boundFolder: "Gebundener Ordner",
        notBound: "Nicht an einen Ordner gebunden",
        folderMissing: "Ordner existiert nicht mehr auf dem Datenträger",
        errors: {
            invalidUrl: "Bitte gib eine gültige URL ein.",
            invalidImageFormat: "Bitte ein Bild im Format JPG, PNG oder WebP hochladen.",
            imageTooLarge: "Das Bild ist zu groß. Maximal 2 MB erlaubt.",
            storageFull:
                "Speicher voll. Bitte alte Covers löschen oder Browser-Cache leeren.",
            setCoverUrl: "Fehler beim Setzen der Cover-URL.",
            uploadCover: "Fehler beim Hochladen des Covers.",
            generic: "Fehler beim Zurücksetzen.",
        },
        acquisitionReasons: {
            artist: "Ich mag den Künstler / die Band",
            "friend-recommendation": "Empfehlung eines Freundes",
            "specific-song": "Ein bestimmter Song",
            concert: "Konzert-Erlebnis",
            review: "Eine Rezension gelesen",
            "record-store": "Im Plattenladen gefunden",
            gift: "Geschenk",
            digital: "iTunes / Online",
            "random-discovery": "Zufällig entdeckt",
            "life-phase": "Es gehört zu einer bestimmten Lebensphase",
            completion: "Komplettierung eines Albums oder einer Ausgabe",
            "collection-essential": "Gehört in die Sammlung",
            unknown: "Ich erinnere mich nicht",
            other: "Anderer Grund",
        },
    },

    playerRotation: {
        label: "Player-Rotation",
        title: (count: number) =>
            count > 0
                ? `${count} Alben für den Player`
                : "Noch keine Player-Rotation",
        subtitle: {
            draft: "Prüfe den Vorschlag, bevor du ihn übernimmst.",
            active: "Eine bewusste Auswahl aus deiner Sammlung.",
            empty: "Erzeuge eine Rotation, um loszulegen.",
        },
        generate: "Rotation vorschlagen",
        newSuggestion: "Neuer Vorschlag",
        accept: "Mitnehmen",
        handover: { title: "Rotation wechseln?", summary: (entering: number, leaving: number, unchanged: number) => `${entering} kommen hinzu · ${leaving} verlassen die Rotation · ${unchanged} bleiben`, size: (size: number, target: number) => `${size} von maximal ${target} Alben`, confirm: "Bestätigen und mitnehmen",error:"Die Wechselvorschau konnte nicht geladen werden.",missingQuota:(count:number)=>`${count} unter der Quote`,exportEstimate:(size:string,files:number)=>`Geschätzter Export: ${size} · ${files} Dateien`,bindingWarning:(missing:number,unconfirmed:number)=>`${missing} fehlende und ${unconfirmed} unbestätigte Bindings`,acceptButNotExportable:"Du kannst diese Rotation übernehmen; der Export bleibt bis zur Klärung der Bindings gesperrt." },
        remove: "Aus der Rotation entfernen",
        replace: "Ersetzen",
        replaceTitle: "Ersatzkandidaten",
        empty: "Keine Alben in der Rotation",
        emptyHint:
            "Sobald genug Alben eingeordnet sind, kann Rotation eine Player-Auswahl vorschlagen.",
        explanation: {
            new: "Dieses Album möchte erst entdeckt werden.",
            growing: "Dieses Album wächst mit jedem Hören ein bisschen mehr.",
            "comfort-food": "Hierhin kommst du immer wieder zurück.",
            classic: "Dieses Album hat dich über die Zeit geprägt.",
            admire: "Du schätzt es — auch wenn du nicht oft dazu greifst.",
            archive: "Dieses Album darf ruhen.",
            noListenSession: "Es wartet auf seine erste Hörsession.",
            notHeardRecently: "Es wurde länger nicht gehört.",
            listenedOften: "Du hast es in letzter Zeit oft gehört.",
            longInRole: "Es gehört schon lange zu dieser Rolle.",
            fillsPlan: "Es ergänzt die aktuelle Auswahl.",
            recommendation: "Es kam ursprünglich durch eine Empfehlung in deine Sammlung.",
            memory: "Eine persönliche Erinnerung hängt daran.",
            default: "Teil der aktuellen Rotation.",
        },
        tooltip: {
            listenSessions: (count: number) =>
                count === 1 ? "Hörsession" : "Hörsessions",
            lastListened: "Zuletzt gehört",
        },
    },

    roleExplorer: {
        intro: "Jede Rolle erzählt eine andere Geschichte über deine Sammlung.",
        backToOverview: "← Zurück",
        backToOverviewAria: "Zurück zur Rollenübersicht",
        futureInsights:
            "Timeline der Rolle, Hör-Auswertung und Übergangsverlauf folgen.",
    },

    discoverAlbum: {
        eyebrow: "Neuzugang · Erfassung",
        title: "Albumkarte anlegen",
        subtitle: "Ordne den Fund ein, ergänze den Datensatz und halte fest, wie er in dein Leben kam.",
        steps: {
            title: {
                label: "Wie heißt das Album?",
                placeholder: "Albumtitel",
            },
            artist: {
                label: "Wer ist der Künstler?",
                placeholder: "Künstler",
            },
            year: {
                label: "Jahr",
                placeholder: "Erscheinungsjahr",
            },
            metadata: {
                title: "Albumdaten ergänzen",
                description:
                    "Rotation kann automatisch weitere Informationen zu deinem Album ergänzen.",
                coverFeature: "Albumcover",
                yearFeature: "Erscheinungsjahr",
                searching: "Suche läuft…",
                searchingStatus: (appName: string) =>
                    `🎵 ${appName} sucht nach deinem Album …`,
                found: "Albumdaten gefunden und übernommen.",
                successStatus:
                    "✅ Albumdaten gefunden. Cover und Erscheinungsjahr wurden ergänzt.",
                notFound:
                    "Keine Albumdaten gefunden. Du kannst das Album trotzdem normal hinzufügen.",
                notFoundStatus:
                    "📦 Leider konnten keine Albumdaten gefunden werden. Du kannst das Album trotzdem ganz normal hinzufügen.",
                errorStatus:
                    "🌐 Die Albumdaten konnten gerade nicht geladen werden. Wir machen trotzdem weiter.",
                addData: "Daten übernehmen",
                skip: "Überspringen",
                moreInfo: "Suche nach mehr Informationen zu deinem Album.",
                searchButton: "Album suchen",
            },
            story: {
                title: "Die persönliche Spur",
                description: "Diese Angaben sind optional und können später jederzeit bearbeitet werden.",
                acquiredBecause: "Warum kam dieses Album zu dir?",
                lifePhase: "Zu welcher Lebensphase gehört es?",
                memoryNote: "Notiz für später",
                memoryPlaceholder: "Ein Ort, ein Mensch, ein Moment oder einfach das Gefühl beim ersten Hören …",
                optional: "Keine Angabe",
            },
        },
        back: "Zurück",
        next: "Weiter",
        finish: "Fertig",
    },

    common: {
        yes: "Ja",
        no: "Nein",
        loading: "Laden...",
        uploadImage: "Bild hochladen",
        album: "Album",
        albums: "Alben",
        coverOf: (title: string) => `Cover von ${title}`,
    },

    nav: {
        home: "Start",
        bindings: "Bindings",
        export: "Export",
        insights: "Insights",
        settings: "Einstellungen",
        history: "Verlauf",
        offline: "Offline — warte auf Verbindung",
        apiUnavailable: "Server nicht erreichbar — lokaler Cache aktiv",
        retrying: "Wiederhole…",
        bindingsAttention: (count: number) => `${count} ${count === 1 ? "ungebundenes Album wartet" : "ungebundene Alben warten"} auf dich`,
    },

    language: {
        label: "Sprache",
        de: "Deutsch",
        en: "English",
    },

    settings: {
        kicker: "Maschinenraum",
        title: "Einstellungen",
        description: "Passe Rotation an, ohne die aktive Auswahl unerwartet zu verändern.",
        composition: "Zusammensetzung der Rotation",
        maximum: "Maximale Anzahl Alben",
        quotaSum: (sum: number, maximum: number) => `Summe der Rollenquoten: ${sum} · Maximum: ${maximum}`,
        appliesNext: "Änderungen gelten ab der nächsten neu erzeugten Rotation.",
        save: "Einstellungen speichern",
        saving: "Wird gespeichert…",
        loadError: "Einstellungen konnten nicht geladen werden.",
        saveError: "Einstellungen konnten nicht gespeichert werden.",
        undoTitle: "Letzte sichere Änderung", undoDescription: "Mache die letzte Rollen- oder Archiventscheidung nur rückgängig, solange keine widersprechende Änderung gefolgt ist.", undo: "Letzte Rollenänderung rückgängig", undoError: "Die Änderung kann nicht mehr sicher rückgängig gemacht werden.", undoPreview: (album:string, role:string) => `${album} wird auf die Rolle „${role}“ zurückgesetzt.`, undoConfirmTitle: "Diese Rolle wiederherstellen?", undoConfirm: "Wiederherstellung bestätigen",
    },
    history: { title: "Rotationsverlauf", description: "Auswahlen, die du bewusst mitgenommen hast.", empty: "Noch keine frühere Rotation.", loadError: "Der Verlauf konnte nicht geladen werden.", archivedAt: (date: string) => `Archiviert am ${new Date(date).toLocaleDateString()}`, albumCount: (count: number) => `${count} Alben`, previous: "Zurück", next: "Weiter",exports:"Ausgelieferte Exporte",noExport:"Diese Rotation wurde nicht exportiert.",exportedAt:(date:string)=>`Exportiert am ${new Date(date).toLocaleDateString()}`,useAsDraft:"Als neuen Vorschlag verwenden",draftError:"Es konnte kein neuer Vorschlag erstellt werden." },

    exportPage: {
        title: "Auf Gerät exportieren",
        description:
            "Exportiere deinen aktiven Rotationsplan in den Synchronisations-Ordner. Dies kopiert die Album-Ordner in das Syncthing-Verzeichnis.",
        preview: "Export-Vorschau",
        noRotationPlan: "Erzeuge und übernehme zuerst einen Rotationsplan.",
        calculating: "Export-Vorschau wird berechnet...",
        albums: "Alben",
        totalSize: "Gesamtgröße",
        files: "Dateien",
        sourceArtist: "Künstler",
        sourceAlbum: "Album",
        sourceFolder: "Quellordner",
        missingBindings: "Fehlende Bindings:",
        unconfirmedBindings: "Unbestätigte Bindings:",
        issueReasons: {
            "album-not-found": "Album ist nicht mehr in der Library",
            "binding-missing": "Album hat kein Dateisystem-Binding",
            "binding-unconfirmed": "Dateisystem-Binding muss bestätigt werden",
        },
        skippedAlbums: "Übersprungene Alben:",
        skippedAlbumsDescription: (count: number) =>
            `${count} Album(e) konnten nicht kopiert werden.`,
        retryStaging: "Erneut versuchen",
        continueAnyway: "Trotzdem fortfahren",
        stagingTimeout:
            "Export-Vorbereitung hat das Zeitlimit überschritten. Bitte erneut versuchen.",
        retryFromStep: "Von aktuellem Schritt wiederholen",
        resetAndStartOver: "Zurücksetzen und neu starten",
        recoveryNotice: (info: { recovered: number; cleanedStagingDirs: number; cleanedArchives: number }) =>
            `Ein vorheriger Export wurde automatisch wiederhergestellt (${info.recovered} Operationen, ${info.cleanedStagingDirs} Staging-Verzeichnisse bereinigt, ${info.cleanedArchives} Archive bereinigt).`,
        crashRecoveryDismiss: "Schließen",
        cancel: "Abbrechen",
        stage: "Export vorbereiten",
        copyProgress: (copied: number, total: number) =>
            `${copied} / ${total} Dateien`,
        copying: "Dateien werden kopiert...",
        apply: "Export anwenden",
        applying: "Export wird angewendet...",
        success: "Export erfolgreich angewendet!",
        previousExportArchived: (path: string) =>
            `Vorheriger Export archiviert unter: ${path}`,
        done: "Fertig",
        error: (msg: string) => `Fehler: ${msg}`,
        reset: "Zurücksetzen",
    },

    bindings: {
        title: "Album Bindings",
        sourceFolder: "Quellordner",
        resolution: "Zuordnung zur Bibliothek",
        filters: {
            unresolved:"Nicht zugeordnet",
            all: "Alle",
            proposed: "Vorgeschlagen",
            confirmed: "Bestätigt",
            missing: "Fehlend",
        },
        resolver:{title:"Albumordner zuordnen",kicker:"Nicht zugeordneter Ordner",description:"Wähle ein bestehendes Album aus der Bibliothek oder erfasse einen neuen Eintrag. Eine erfolgreiche Auswahl bestätigt das Binding sofort.",open:"Zuordnen",create:"Neues Bibliotheksalbum erfassen",cancel:"Abbrechen"},
        state: {
            proposed: "Vorgeschlagen",
            confirmed: "Bestätigt",
            missing: "Fehlend",
        },
        confirm: "Bestätigen",
        delete: "Löschen",
        error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
        empty: "Keine Bindings gefunden.",
        confirmDelete: "Bist du sicher, dass du dieses Binding löschen möchtest?",
        folderMissing: "Ordner nicht gefunden",
        verify: "Überprüfen",
        reconcile: "Abgleichen",
        scanNow: "Musikordner scannen",
        scanning: "Musikordner wird gescannt…",
        scanTooltip: "Scannt den Musikordner jetzt und erzeugt Bindings für neu gefundene Albumordner",
        scanProgress: (scanned: number, skipped: number) =>
            `${scanned} Verzeichnisse gescannt, ${skipped} übersprungen`,
        scanSuccess: "Musikscan abgeschlossen. Bindings wurden aktualisiert.",
        scanFailed: "Musikscan fehlgeschlagen.",
        scanTimeout: "Zeitüberschreitung beim Musikscan. Bitte Diagnose prüfen und erneut versuchen.",
        verifyTooltip:
            "Prüft alle bestätigten Bindings gegen das Dateisystem und markiert fehlende Ordner",
        reconcileTooltip:
            "Hebt vorgeschlagene Bindings zu bestätigten hoch, wenn der Ordner noch existiert",
        verifyResult: (ok: number, missing: number) =>
            `${ok} bestätigt, ${missing} fehlend`,
        reconcileResult: (count: number) =>
            `${count} vorgeschlagene Bindings bestätigt`,
        orphanBadge: "Nicht in Bibliothek",
        albumPreview: (title: string, artist: string) =>
            `${title} von ${artist}`,
        orphanBanner: (count: number) =>
            count === 1
                ? "1 verwaister Ordner erkannt – siehe Bindings-Seite."
                : `${count} verwaiste Ordner erkannt – siehe Bindings-Seite.`,
        capture: "Erfassen",
        captureSuccess: "Album erfasst und verknüpft.",
        coachSuccess: "Albumrolle gespeichert.",
        viewInLibrary: "In Bibliothek anzeigen",
        candidates: {
            review: "Treffer prüfen",
            select: "Auswählen",
            reject: "Vorschläge verwerfen",
            manual: "Anderes Album aus der Bibliothek auswählen",
            searchPlaceholder: "Künstler oder Titel suchen",
            none: "Keine belastbaren Treffer gefunden. Du kannst das Album stattdessen neu erfassen.",
            confidence: { strong: "Sehr ähnliche Metadaten", possible: "Möglicher Treffer", ambiguous: "Mehrdeutiger Treffer" },
            reasons: {
                "title-exact": "Titel stimmt überein",
                "title-similar": "Titel ist ähnlich",
                "artist-exact": "Künstler stimmt überein",
                "artist-similar": "Künstler ist ähnlich",
                "volume-conflict": "Abweichende Volume-Nummer",
            },
        },
    },

    diagnostics: {
        error: "Fehler",
        loading: "Diagnose lädt...",
        allOk: "Alles in Ordnung",
        infoStatus: "Bereit — noch kein Scan durchgeführt",
        issuesDetected: "Probleme erkannt — Details anzeigen",
        refresh: "Aktualisieren",
        scanNow: "Ordner scannen",
        scanning: "Scan läuft…",
        scanningWithProgress: (scanned: number, skipped: number) =>
            `Scan läuft… (${scanned} Verzeichnisse gescannt, ${skipped} übersprungen)`,
        scanQueued: "Scan gestartet, bitte warten…",
        coverBatchSummary: (attempted: number, local: number, cached: number, missing: number, failed: number) =>
            `Cover-Auflösung: ${attempted} geprüft, ${local} lokal, ${cached} gecacht, ${missing} fehlend, ${failed} fehlgeschlagen`,
        database: "Datenbank",
        databaseFail: "Nicht erreichbar",
        musicFolder: "Musik-Ordner",
        musicFolderMissing: "Nicht vorhanden",
        musicFolderNotReadable: "Nicht lesbar",
        workspaceFolder: "Workspace-Ordner",
        workspaceFolderMissing: "Nicht vorhanden",
        workspaceFolderNotWritable: "Nicht beschreibbar",
        syncthingFolder: "Syncthing-Ordner",
        syncthingFolderMissing: "Nicht vorhanden",
        syncthingFolderNotWritable: "Nicht beschreibbar",
        bindings: "Bindings",
        confirmed: "bestätigt",
        proposed: "vorgeschlagen",
        albumFolders: "Album-Ordner",
        ok: "OK",
        bindingsEmptyAfterScan: "Nach dem letzten Scan keine Bindings gefunden",
        bindingsNoScan: "Noch kein Scan durchgeführt",
        lastScan: "Letzter Scan",
        artworkProbeTitle: "Machbarkeit lokaler Cover",
        artworkProbeDescription: "Liest je eine begrenzte MP3-, M4A- und FLAC-Probe aus bestätigten Bindings. Pfade, Tags und Bilddaten verlassen den Server nicht.",
        artworkProbeRun: "Cover-Test ausführen",
        artworkProbeRunning: "Cover werden geprüft…",
        artworkProbeInspected: (count: number) => `${count} bestätigte Bindings untersucht`,
        artworkProbeTime: (milliseconds: number) => `${milliseconds} ms`,
        artworkProbeMemory: (memory: string) => `RSS-Differenz ${memory}`,
        artworkProbeCover: (size: string) => `Cover ${size}`,
        artworkProbeMissing: (formats: string) => `Keine begrenzte Probe gefunden für: ${formats}`,
        artworkProbeOutcome: {
            cover: "Eingebettetes Cover gefunden",
            "no-cover": "Kein eingebettetes Cover",
            "parse-error": "Metadaten konnten nicht gelesen werden",
        },
    },
}
