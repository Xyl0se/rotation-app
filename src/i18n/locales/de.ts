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
        pendingChanges: "Änderungen sind lokal gespeichert und warten auf Synchronisierung.",
        syncFailed: "Die Bibliothek konnte nicht synchronisiert werden. Deine lokalen Änderungen sind sicher.",
        retrySync: "Synchronisierung wiederholen",
    },

    emptyLibrary: {
        title: "Noch keine Alben",
        description:
            "Beginne deine persönliche Musiksammlung, indem du dein erstes Album hinzufügst.",
        cta: "Neues Album entdecken",
        orImport: "Oder importiere ein bestehendes Backup:",
    },

    focusAlbum: {
        label: "Fokusalbum",
        roleSince: "Aktuelle Rolle seit",
        listenCountLabel: "Hörsessions",
        lastListenedLabel: "Zuletzt gehört",
        noListenSession: "Noch keine Hörsession",
        listened: "Gehört",
    },

    albumStory: {
        why: "Warum",
        when: "Wann",
    },

    acquisitionReasons: {
        artist: "Künstler",
        "friend-recommendation": "Empfehlung",
        "specific-song": "Song",
        concert: "Konzert",
        review: "Rezension",
        "record-store": "Plattenladen",
        gift: "Geschenk",
        "random-discovery": "Zufall",
        "life-phase": "Lebensphase",
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
        other: "Andere",
    },

    dashboard: {
        title: "Dashboard",
        subtitle: "Was gerade Aufmerksamkeit verdient.",
        nextQuestion: "Nächste Frage",
        insights: "Insights",
        roleOverview: "Rollenübersicht",
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
    },

    reflection: {
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
        questions: {
            heardThreeTimes: {
                title: "Hast du dieses Album mindestens dreimal bewusst gehört?",
                description:
                    "Erst nach mehreren Durchgängen entsteht meist ein belastbarer Eindruck.",
            },
            wouldMissAlbum: {
                title: "Würdest du dieses Album vermissen, wenn es morgen nicht mehr verfügbar wäre?",
                description: "",
            },
            stillReturningConsciously: {
                title: "Kehrst du heute noch bewusst zu diesem Album zurück?",
                description: "",
            },
            shapedTasteLongterm: {
                title:
                    "Hat dieses Album dich über längere Zeit begleitet oder deinen Musikgeschmack geprägt?",
                description:
                    "Persönliche Klassiker bleiben auch dann bestehen, wenn sie gerade weniger häufig gespielt werden.",
            },
            reachesAutomatically: {
                title:
                    "Greifst du manchmal ganz automatisch zu diesem Album, ohne lange über deine Musikauswahl nachzudenken?",
                description:
                    "Comfort-Food-Alben fühlen sich vertraut an und begleiten dich zuverlässig.",
            },
            surprisedLastListen: {
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
            memoryOfEarlierPhase: {
                title: "Ist es vor allem Erinnerung an eine frühere Phase?",
                description: "",
            },
        },
        result: {
            ourRecommendation: "Unsere Empfehlung",
            roleAssigned: (roleTitle: string) =>
                `Die Rolle "${roleTitle}" passt gut zu diesem Album.`,
            accept: "Rolle übernehmen",
        },
        orphanPrompt: {
            title: "Dieses Album ist noch nicht in deiner Bibliothek",
            description: "Möchtest du es erfassen?",
            dismiss: "Nicht jetzt",
            capture: "Album erfassen",
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
    },

    albumCard: {
        archiveLabel: "Archiv",
        listened: "Gehört",
        listenCount: (count: number) => `${count}x gehört`,
        setFocus: "Fokus setzen",
        edit: "Album bearbeiten",
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
        title: "Album-Metadaten bearbeiten",
        subtitle: "Korrigiere die Metadaten dieses Albums. Die Rolle bleibt unverändert.",
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
            "random-discovery": "Zufällig entdeckt",
            "life-phase": "Es gehört zu einer bestimmten Lebensphase",
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
        },
        back: "Zurück",
        next: "Weiter",
        finish: "Fertig",
    },

    backup: {
        export: "Exportieren",
        import: "Importieren",
        exportSuccess: "Backup heruntergeladen.",
        importSuccess:
            "Backup erfolgreich wiederhergestellt. Seite wird neu geladen...",
        importDialog: {
            title: "Backup importieren",
            description: (fileName: string) =>
                `Möchtest du wirklich das Backup ${fileName} importieren?`,
            warning:
                "Alle bestehenden Daten werden überschrieben. Diese Aktion kann nicht rückgängig gemacht werden.",
            import: "Importieren",
            cancel: "Abbrechen",
        },
        errors: {
            invalidFormat: "Ungültiges Backup-Format.",
            noSchemaVersion: "Backup hat keine gültige Schema-Version.",
            noDate: "Backup hat kein gültiges Export-Datum.",
            noData: "Backup enthält keine gültigen Daten.",
            invalidJson: "Ungültige JSON-Datei.",
            readError: "Datei konnte nicht gelesen werden.",
            generic: "Fehler beim Wiederherstellen des Backups.",
        },
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
        offline: "Offline — warte auf Verbindung",
        apiUnavailable: "Server nicht erreichbar — lokaler Cache aktiv",
        retrying: "Wiederhole…",
    },

    language: {
        label: "Sprache",
        de: "Deutsch",
        en: "English",
    },

    writeToken: {
        title: "Write-Token",
        description:
            "Gib den ROTATION_WRITE_TOKEN aus deiner Server-Umgebung ein, um Schreiboperationen wie Scans und Exporte zu ermöglichen.",
        placeholder: "Token hier einfügen...",
        save: "Speichern",
        clear: "Löschen",
        saved: "Gespeichert",
    },

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
        filters: {
            all: "Alle",
            proposed: "Vorgeschlagen",
            confirmed: "Bestätigt",
            missing: "Fehlend",
        },
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
        viewInLibrary: "In Bibliothek anzeigen",
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
    },
}
