import { APP_VERSION } from "../../config/appVersion"

export const en = {
    roles: {
        new: {
            title: "Newly Discovered",
            description: "I want to get to know this album first.",
        },
        growing: {
            title: "Still Growing",
            description: "I discover more with every listen.",
        },
        "comfort-food": {
            title: "Comfort Food",
            description: "I keep coming back to this one.",
        },
        classic: {
            title: "Classic",
            description:
                "This album has shaped me over a longer period and remains part of my musical biography.",
        },
        admire: {
            title: "Admiration",
            description:
                "I recognize its musical greatness, even if I don't instinctively reach for it anymore.",
        },
        archive: {
            title: "Archive",
            description:
                "This album may rest for now, without disappearing from my story.",
        },
    },

    roleEmpty: {
        new: "No album is waiting to be discovered yet.",
        growing:
            "Nothing is growing here yet — but every collection starts small.",
        "comfort-food": "There is no place you keep returning to yet.",
        classic: "No album accompanies you as a classic yet.",
        admire: "You don't stand in admiration before any album yet.",
        archive:
            "The archive is still empty — some albums just need time.",
        default: "This role is still waiting for its first album.",
    },

    welcome: {
        title: "Rotation",
        subtitle:
            "Music doesn't change. Your relationship to it does.",
        description:
            "Rotation helps you listen to albums consciously, rediscover them, and let your personal library grow over many years.",
        cta: "Start My Library",
        version: `Version ${APP_VERSION}`,
    },

    header: {
        title: "Rotation",
    },

    home: {
        suggestFocusAlbum: "Suggest New Focus Album",
        discoverAlbum: "Discover New Album",
        syncingLibrary: "Synchronizing Library…",
        libraryUnavailable: "The server Library is unavailable",
        retryLibrary: "Reload Library",
    },

    emptyLibrary: {
        title: "No albums yet",
        description:
            "Scan your music folder first, then capture one of the albums found there.",
        cta: "Open Bindings",
    },

    focusAlbum: {
        label: "Focus Album",
        roleSince: "Current role since",
        listenCountLabel: "Listen Sessions",
        lastListenedLabel: "Last Listened",
        noListenSession: "No listen session yet",
        listened: "Listened",
        timeline: "Album history",
        emptyTitle: "No Focus Album selected yet",
        emptyDescription: "Let Rotation choose a random album from your active Rotation.",
        needsRotation: "Activate a Rotation first to select a Focus Album from it.",
    },

    albumStory: {
        why: "Why",
        when: "When",
    },

    albumDetail: {
        kicker: "Album journey",
        back: "← Back to Library",
        loading: "Loading Album details…",
        loadingRelated: "Loading related Album history…",
        notFoundTitle: "Album not found",
        notFound: (id: string) => `No Album with the ID ${id} is available.`,
        unknownYear: "Release year unknown",
        listened: "Listened",
        edit: "Edit Album",
        partialTitle: "Some related information is unavailable.",
        partialDescription: "The Album data that is already available remains visible.",
        story: { title: "My story", memory: "Memory", empty: "No personal Album story has been recorded yet." },
        roleHistory: { title: "Role history", empty: "No Role changes have been documented yet.", source: { coach: "Album Coach", reflection: "Reflection", archive: "Archive workflow" } },
        listening: { title: "Listening sessions", summary: (count: number) => `${count} documented ${count === 1 ? "session" : "sessions"}`, empty: "This Album has no documented listening session yet." },
        reflections: {
            title: "Reflections", empty: "There are no open Reflections for this Album.",
            rules: { "new-after-listens": "Review discovery", "growing-for-a-while": "Review growth", "comfort-not-recent": "Revisit a familiar Album", "archive-return-candidate": "Possible return from Archive", "never-heard-dormant": "Still unheard", "rotation-absent-dormant": "Outside the Rotation" },
            state: { open: "Open", snoozed: "Snoozed", resolved: "Resolved", dismissed: "Dismissed" },
        },
        rotation: { title: "Rotation", current: (name: string) => `Currently included in “${name}”.`, history: (count: number) => `${count} historic ${count === 1 ? "Rotation" : "Rotations"}`, empty: "This Album is not part of a current or documented historic Rotation." },
        binding: { title: "Music folder", stateLabel: "Binding", folder: "Folder", availability: "Availability", missing: "The linked folder is currently missing.", empty: "No music-folder Binding is confirmed for this Album.", states: { proposed: "Proposed", confirmed: "Confirmed", missing: "Missing" } },
    },

    albumSources: {
        title: "External sources",
        description: "Search only when you want to review or correct stored references. Nothing is replaced before you save.",
        empty: "No external source is stored for this Album.",
        provider: "Provider", url: "Canonical URL", remove: "Remove", matches: "Review MusicBrainz matches",
        noMatches: "Start an explicit search to find or replace references.", find: "Find external sources", working: "Searching…", save: "Save reviewed sources", saved: "The reviewed sources were saved.", error: "The source operation failed.",
        providers: { musicbrainz: "MusicBrainz", wikipedia: "Wikipedia", wikidata: "Wikidata" },
        manage: "Manage external sources",
    },

    externalSources: {
        kicker: "Further reading", title: "External sources", description: "Verified destinations stored by Rotation. They open on the provider's website.",
        providers: { musicbrainz: "MusicBrainz", wikipedia: "Wikipedia", wikidata: "Wikidata" },
        actions: { musicbrainz: "View on MusicBrainz", wikipedia: "Read on Wikipedia", wikidata: "View on Wikidata" },
    },

    acquisitionReasons: {
        artist: "Artist",
        "friend-recommendation": "Recommendation",
        "specific-song": "Song",
        concert: "Concert",
        review: "Review",
        "record-store": "Record Store",
        gift: "Gift",
        digital: "iTunes / Online",
        "random-discovery": "Random Discovery",
        "life-phase": "Life Phase",
        completion: "Completion",
        "collection-essential": "Collection essential",
        unknown: "I don't remember",
        other: "Other",
    },

    lifePhases: {
        childhood: "Childhood",
        school: "School",
        studies: "Studies",
        "first-apartment": "First Apartment",
        relationship: "Relationship",
        breakup: "Breakup",
        work: "Work",
        travel: "Travel",
        family: "Family",
        current: "Current",
        unknown: "I don't remember",
        other: "Other",
    },

    dashboard: {
        title: "Dashboard",
        subtitle: "What deserves attention right now.",
        nextQuestion: "Next Question",
        insights: "Insights",
        roleOverview: "Role Overview",
    },

    insightsPage: {
        kicker: "A quiet look at your collection",
        title: "Insights",
        description: "Questions, observations, and the roles your albums currently hold.",
    },

    insights: {
        buildingLibrary: {
            title: "Your collection is taking shape",
            description:
                "With a few more albums, Rotation can start recognizing first patterns in your collection.",
        },
        discoveryPhase: {
            title: "You're in a discovery phase",
            description:
                "Many albums in your collection still want to grow or be discovered.",
        },
        archiveHeavy: {
            title: "A noticeable part of your collection is resting",
            description:
                "The archive has gained weight. Maybe there's a rediscovery candidate in there soon.",
        },
        comfortHeavy: {
            title: "Your collection is seeking familiarity",
            description:
                "Comfort-food albums are taking up a lot of space right now. This can be a very stable listening phase.",
        },
        classicCore: {
            title: "Your collection has a clear classic core",
            description:
                "A part of your collection now feels permanently formative.",
        },
        editorialIntro: "A few evidence-backed observations, never a score.",
        loading: "Looking carefully across your listening history…",
        unavailable: "Deeper insights are unavailable right now.",
        retry: "Try again",
        why: "Why am I seeing this?",
        supportedEvidence: "A visible pattern",
        strongEvidence: "A well-supported pattern",
        memoryPrompt: {
            eyebrow: "An open memory",
            acquisitionQuestion: "Do you remember how this Album came to you?",
            lifePhaseQuestion: "Do you remember which phase of life this Album belongs to?",
            openAlbum: "Add to Album history",
        },
        narratives: {
            discoveryRising:{title:"Discovery has moved forward",description:"Recent listening has leaned more toward albums that are new or still growing than the period before."},
            familiarityRising:{title:"Familiar albums have come closer",description:"Recent listening has returned more often to comfort and classics than in the period before."},
            listeningBalanced:{title:"Discovery and familiarity share the room",description:"Recent listening has made similar space for growing relationships and familiar albums."},
            dormantLibrary:{title:"A quiet part of the Library is resting",description:"A meaningful group of albums has neither been heard recently nor appeared in the current Rotation."},
            rediscoveryMoments:{title:"Something long quiet has returned",description:"Several recent listens followed a pause of at least six months."},
            rolesInMotion:{title:"Album relationships have been moving",description:"Several established albums have received a new role during the recent months."},
            rotationEvolving:{title:"The Rotation has changed its company",description:"The current Rotation brings in and leaves behind a noticeable set of albums compared with the previous cycle."},
            recurringArtist:{title:"{subject} keeps returning",description:"Recent listening has moved through several Albums by {subject}, forming a recurring artist thread."},
            listeningEra:{title:"The {subject} are in the room",description:"Albums released in the {subject} have appeared repeatedly in recent listening."},
            lifePhaseReturn:{title:"Music from {subject} has resurfaced",description:"Several recent listens connect to Albums you assigned to the life phase {subject}."},
            acquisitionThread:{title:"A shared origin is echoing",description:"Several recent listens connect to Albums acquired through “{subject}”."},
        },
        evidence: {
            recentListens:"{count} listens in the recent 90-day window",previousListens:"{count} listens in the preceding 90-day window",recentDiscoveryListens:"{count} recent listens were discovery or growth",previousDiscoveryListens:"{count} earlier listens were discovery or growth",recentFamiliarListens:"{count} recent listens were comfort or classics",previousFamiliarListens:"{count} earlier listens were comfort or classics",dormantAlbums:"{count} albums were quiet and outside the active Rotation",libraryAlbums:"{count} albums form the current Library",rediscoveredListens:"{count} listens returned after at least 180 days",recentRoleTransitions:"{count} established Album roles changed in the last 180 days",rotationEntering:"{count} albums entered the current Rotation",rotationLeaving:"{count} albums left after the previous Rotation",rotationUnchanged:"{count} albums remained across both Rotations",
            artistListens:"{count} recent listens belonged to this artist",artistAlbums:"{count} different Albums support the artist thread",knownYearAlbums:"{count} Library Albums have a usable release year",eraListens:"{count} recent listens belonged to this release decade",eraAlbums:"{count} Library Albums belong to this decade",annotatedAlbums:"{count} Albums have structured personal-history fields",personalThemeListens:"{count} recent listens share this structured personal-history theme",
        },
        building: {
            library:{title:"The Library is still taking shape",description:"A few more Albums are needed before Rotation can describe a reliable pattern."},
            listeningComparison:{title:"A listening comparison is growing",description:"Once both 90-day windows contain at least five listens, Rotation can describe how your listening emphasis has changed."},
            rotationComparison:{title:"A second Rotation will add perspective",description:"Once a previous accepted Rotation exists, Rotation can describe what has entered, stayed, or left."},
        },
    },

    reflection: {
        inbox: { label:"Reflection inbox",loading:"Looking for meaningful moments…",unavailable:"The reflection inbox is unavailable right now.",retry:"Try again",evidence:"{listens} listens · {days} days in this role",later30:"Later · 30 days",later90:"Quiet for 90 days",dismiss:"Do not ask again for this evidence" },
        empty: {
            label: "Reflection",
            title: "No open question right now",
            description: "Your collection feels settled at the moment. When an album needs attention again, Rotation will ask here.",
        },
        newAfterListens: {
            title: "Maybe this album isn't new anymore",
            description:
                "You've listened to it several times by now. Perhaps it already has a clearer role in your rotation.",
            action: "Reassign",
        },
        growingForAWhile: {
            title: "Is this album still growing?",
            description:
                "This album has been in the role 'Still Growing' for a while. A fresh look can show whether it still belongs there.",
            action: "Reassign",
        },
        comfortNotRecent: {
            title: "Is this still comfort food?",
            description:
                "This album used to be familiar, but hasn't been listened to in a while. Perhaps its role is different today.",
            action: "Reassign",
        },
        archiveReturnCandidate: {
            title: "Candidate for rediscovery?",
            description:
                "This album has been resting in the archive for a while. Perhaps it's worth cautiously checking whether it fits back into your rotation today.",
            action: "Check Rediscovery",
        },
        neverHeardDormant: { title:"Does this album deserve a first chance?",description:"It has been in your collection for a while without a listening session.",action:"Reflect now" },
        rotationAbsentDormant: { title:"Could this album return to your Rotation?",description:"It has not appeared in recent Rotations and may be worth a deliberate look.",action:"Reflect now" },
        later: "Later",
    },

    coach: {
        intro: {
            line1: "Every album plays a different role over time.",
            line2: "Some accompany us for years.",
            line3: "Others grow slowly. Still others may eventually find their place in the archive.",
            cta: (albumTitle: string) =>
                `Let's figure out which role ${albumTitle} plays for you today.`,
            start: "Let's go",
        },
        snapshot: {
            step: "Step 2 of 3 · Relationship snapshot",
            title: "What is your relationship with this album today?",
            description: "A few compact signals are enough. There are no right answers, and nothing is saved yet.",
            exposure: { label:"How often have you listened consciously?",options:{ none:"Not yet","up-to-three":"Up to three times","more-than-three":"More than three times" } },
            explore: { label:"Do you want to give this album a real chance?" },
            yesNo: { yes:"Yes",no:"No" },
            connection: "How strong is your personal connection?",
            connectionOptions: { "1":"1 · Little","2":"2","3":"3","4":"4","5":"5 · Very strong" },
            returnBehavior: { label:"How often do you consciously return?",options:{ regularly:"Regularly",occasionally:"Occasionally",rarely:"Rarely",never:"Never" } },
            ownership: { label:"How long has it been part of your collection?",options:{ "under-six-months":"Under 6 months","six-months-to-two-years":"6 months–2 years","two-to-ten-years":"2–10 years","over-ten-years":"Over 10 years" } },
            binary: { formative:"Did it shape your taste or musical biography?",comfort:"Is returning primarily comforting and familiar?",continuingDiscovery:"Does it still reveal, surprise, or challenge?" },
            conclusion: { label:"If no active role is obvious: which statement is closest?",options:{ "keep-exploring":"I still want to know it better","personally-valued":"I value it, though I rarely listen","relationship-complete":"It had its time; the relationship is complete","canonical-but-not-personal":"I understand its significance, but it is not mine","no-connection":"It never reached me despite several attempts" } },
            validation: "Please complete the relevant choices before continuing.",continue:"Show recommendation",
        },
        questions: {
            heardThreeTimes: {
                title: "Have you listened to this album at least three times consciously?",
                description:
                    "Only after several listens does a reliable impression usually form.",
            },
            wantsToGiveChance: {
                title: "Do you want to give this album a real chance?",
                description:
                    "Yes keeps it as Newly Discovered in your Rotation. No moves it to the Archive without requiring more listens.",
            },
            stillReturningConsciously: {
                title: "Do you still consciously return to this album today?",
                description:
                    "This distinguishes an active relationship from one that is currently resting.",
            },
            shapedTasteLongterm: {
                title:
                    "Has this album accompanied you over a longer period or shaped your taste in music?",
                description:
                    "Personal classics persist even when played less frequently.",
            },
            comfortAlbum: {
                title:
                    "Do you sometimes reach for this album completely automatically, without thinking much about your music choice?",
                description:
                    "Comfort-food albums feel familiar and accompany you reliably.",
            },
            comfortDefinesRelationshipToday: {
                title:
                    "Does familiar, effortless return describe your relationship today more strongly than its long-term influence?",
                description:
                    "Yes points to Comfort Food; No gives the biographical influence more weight as a Classic.",
            },
            surprisedOnLastListen: {
                title:
                    "Did the album surprise or challenge you during the last conscious listen?",
                description:
                    "Some albums keep growing with every listen.",
            },
            musicallyValued: {
                title: "Do you still value it musically very much?",
                description:
                    "High musical appreciation is enough for admiration, even without active return.",
            },
        },
        result: {
            step: "Step 3 of 3 · Recommendation",
            ourRecommendation: "Our Recommendation",
            roleAssigned: (roleTitle: string) =>
                `The role "${roleTitle}" fits this album well.`,
            chooseRole:"Choose final role",archiveReason:"What best explains the Archive decision?",back:"Back to snapshot",accept: "Confirm Role",
        },
        reasons: { "new-exploration":"You have not explored it fully yet and want to give it more room.","formative-classic":"Your strong personal connection and formative history point to a personal Classic.","familiar-return":"Familiar, reliable return defines the relationship today.","continuing-discovery":"The album still gives you something to discover.","personal-admiration":"You value it personally even without frequent return.","declined-discovery":"You do not want to give this still-unfamiliar album more room right now.","completed-relationship":"The album had its time, but the relationship now feels complete.","canonical-distance":"You recognize its significance without a personal active relationship.","no-connection":"You gave it enough room, but no lasting connection emerged." },
        archiveReasons: { "not-interested-in-discovery":{title:"Not pursuing discovery",description:"I do not want to give this unfamiliar album more room now."},"relationship-complete":{title:"Relationship complete",description:"It had its place in my life, but that phase is over."},"canonical-but-not-personal":{title:"Important, but not mine",description:"I recognize its significance without a personal bond."},"no-connection":{title:"No connection",description:"It never reached me despite enough attention."} },
        orphanPrompt: {
            title: "Unbound albums are waiting for you",
            description: "Entries from your music folder are ready to be reviewed and captured on the Bindings page.",
            dismiss: "Not now",
            capture: "Open Bindings",
        },
    },

    archive: {
        protection: {
            questions: {
                hasBiographicPlace: {
                    title:
                        "Does this album have a permanent place in your musical biography?",
                    description:
                        "A personal classic can rest currently and still remain a classic.",
                },
                stillReturningConsciously: {
                    title:
                        "Do you still consciously return to this album today?",
                    description:
                        "If you still actively reach for it, perhaps it's admiration rather than archive.",
                },
                musicallyValued: {
                    title: "Do you still value it musically very much?",
                    description:
                        "High musical appreciation is enough for admiration, even without active return.",
                },
            },
            keepInArchive: "This album may rest",
            protectFromArchive: "This album remains protected",
            accept: "Accept Decision",
            cancel: "Cancel",
        },
        return: {
            questions: {
                heardLastSixMonths: {
                    title:
                        "Have you listened to this album at least once consciously in the last 6 months?",
                    description:
                        "If it still appears actively, it may remain quietly in the archive.",
                },
                remembersMoment: {
                    title:
                        "Do you spontaneously remember a song, a riff, a lyric line, or a special moment?",
                    description:
                        "Rediscovery often begins with a small, clear spark of memory.",
                },
                wouldDefendAlbum: {
                    title:
                        'Would you disagree with someone who says: "This album is actually pretty average"?',
                    description:
                        "If you would defend it, perhaps it's a classic.",
                },
                reason: {
                    title: "Why did you acquire this album back then?",
                    description:
                        "The answer doesn't change the role alone, but helps with remembering.",
                    options: {
                        recommendation: "Recommendation or year-end list",
                        artist: "Loved the band or artist",
                        curiosity: "Curiosity, cover, or impulse buy",
                    },
                },
                fitsCurrentMood: {
                    title:
                        "Does this album fit your current life phase or listening mood?",
                    description:
                        "Not every good album needs to return to the rotation right now.",
                },
                listeningNeed: {
                    title:
                        "Are you looking for familiarity or discovery today?",
                    description:
                        "Familiarity tends toward Classic, discovery tends toward Still Growing.",
                    options: {
                        familiarity: "Familiarity",
                        discovery: "Discovery",
                    },
                },
            },
            allowReturn: "This album may return",
            keepArchived: "This album stays in the archive",
            accept: "Accept Decision",
            later: "Later",
        },
    },

    timeline: {
        title: "Album timeline",
        header: "The documented story of this album so far.",
        noEvents: "No documented events yet.",
        latestEvents: "Latest Events",
        firstSession: "First Listen Session",
        lastSession: "Last Listen Session",
        sessionN: (n: number) => `Listen Session ${n}`,
        roleAssignedBy: (source: string) => `Assigned via ${source}.`,
        storyAdded: "Story added",
        storyAcquiredBecause: (reason: string) => `Acquired because: ${reason}`,
        storyLinked: "A personal story was linked.",
        lastListened: "Last Listened",
        listenCountDescription: (count: number) =>
            count === 1
                ? "The first documented listen session."
                : `${count} documented listen sessions in total.`,
        sessionDescription: (current: number, total: number) =>
            current === 0
                ? `Most recent documented session (${total} in total).`
                : `Session ${total - current} of ${total}.`,
        coach: "Album Coach",
        reflection: "Reflection",
        archiveWorkflow: "Archive Workflow",
        sourceDefault: "Rotation",
    },

    journal: {
        title: "Listening Journal",
        kicker: "A thought from this listen",
        addThought: "Add a thought",
        dismiss: "Not now",
        note: "What stayed with you?",
        placeholder: "A sound, a feeling, a moment…",
        mood: "Mood",
        context: "Context",
        moods: { calm:"Calm", energized:"Energized", melancholic:"Melancholic", curious:"Curious", nostalgic:"Nostalgic" },
        contexts: { focused:"Focused listening", background:"In the background", "on-the-go":"On the go", evening:"In the evening", shared:"Listened together" },
        save: "Save thought",
        cancel: "Cancel",
        delete: "Remove note",
        edit: "Edit thought",
        previous: "Previous listening notes",
        saveError: "Your text is still here. Saving failed; please try again.",
        inferredRole: (role:string) => `Role at that time (derived): ${role}`,
    },

    library: {
        title: "Library",
        views: {
            all: "All",
            byRole: "By Role",
            perspectives: "Perspectives",
            artist: "Artist",
            year: "Year",
            lastListened: "Listen Session",
            roleChange: "Role Change",
        },
        recency: {
            today: "Today",
            thisWeek: "This Week",
            thisMonth: "This Month",
            thisYear: "This Year",
            older: "A While Ago",
            never: "Not Yet Listened",
        },
        unknownArtist: "Unknown",
        unknownYear: "Unknown Year",
        noRoleChange: "No Assignment Yet",
        controls: {
            label: "Search and filter Library",
            searchLabel: "Search",
            searchPlaceholder: "Title, artist, or Album Story",
            resultCount: (visible: number, total: number) => `${visible} of ${total} albums`,
            role: "Role",
            allRoles: "All roles",
            noRole: "No role assigned",
            archive: "Status",
            allAlbums: "All albums",
            activeOnly: "Active albums only",
            archivedOnly: "Archive only",
            listening: "Listening status",
            anyListening: "Any listening status",
            neverListened: "Never listened",
            yearFrom: "Year from",
            yearTo: "Year to",
            quickViews: "Quick views",
            recentlyArchived: "Recently archived",
            neverListenedRule: "Albums without a documented listening session and with a listen count of 0.",
            recentlyArchivedRule: "Albums whose current role is Archive and which were archived within the last 30 days.",
            reset: "Reset filters",
            noResults: "No albums match the current search and filters.",
        },
        pagination: {
            label: "Library pages",
            previous: "Previous",
            next: "Next",
            status: (page: number, total: number) => `Page ${page} of ${total}`,
        },
    },

    albumCard: {
        archiveLabel: "Archive",
        listened: "Listened",
        listenCount: (count: number) => `${count}x listened`,
        setFocus: "Set Focus",
        edit: "Edit Album",
        startCoach: "Determine role with Album Coach",
        archive: "Move to Archive",
        reconsider: "Check Rediscovery",
        delete: "Delete Album",
        bound: "Bound",
        unbound: "Unbound",
        boundTooltip: (path: string) => `Files at: ${path}`,
        missingFolderTooltip: (path: string) => `Folder missing: ${path}`,
    },

    deleteDialog: {
        title: "Really delete album?",
        description:
            "This album will be permanently removed from your library. This action cannot be undone.",
        confirm: "Yes, Delete",
        cancel: "Cancel",
    },

    editDialog: {
        retryCover: "Find cover again",
        coverResolution: {
            cached: "The cover was found and updated.",
            localNotFound: "No local artwork was found.",
            localInvalid: "The artwork found is corrupt or invalid.",
            remoteUnavailable: "The remote cover provider is temporarily unavailable.",
            notFound: "No cover could be found.",
        },
        startCoach: "Determine role with Album Coach",
        changeRole: "Change role with Album Coach",
        title: "Edit Album Metadata",
        subtitle: "Correct metadata and album history or reassess its role.",
        titleLabel: "Title",
        artistLabel: "Artist",
        yearLabel: "Year",
        coverUrlLabel: "Cover URL",
        resetCover: "Reset Cover",
        save: "Save",
        cancel: "Cancel",
        storyTitle: "Album Story",
        acquiredBecauseLabel: "Why did you acquire this album?",
        lifePhaseLabel: "Which life phase does it belong to?",
        memoryNoteLabel: "Memory Note",
        memoryNotePlaceholder:
            "What do you remember when you hear this album?",
        deleteStory: "Delete Story",
        loadCover: "Load",
        coverLabelUpload: "Custom Cover",
        coverLabelAlternative: "Alternative Cover",
        coverLabelUrl: "URL Override",
        selectPlaceholder: "Please select...",
        boundFolder: "Bound folder",
        notBound: "Not bound to any folder",
        folderMissing: "Folder no longer exists on disk",
        errors: {
            invalidUrl: "Please enter a valid URL.",
            invalidImageFormat: "Please upload an image in JPG, PNG or WebP format.",
            imageTooLarge: "The image is too large. Maximum 2 MB allowed.",
            storageFull:
                "Storage full. Please delete old covers or clear browser cache.",
            setCoverUrl: "Error setting cover URL.",
            uploadCover: "Error uploading cover.",
            generic: "Error while resetting.",
        },
        acquisitionReasons: {
            artist: "I like the artist / band",
            "friend-recommendation": "Recommendation from a friend",
            "specific-song": "A specific song",
            concert: "Concert experience",
            review: "Read a review",
            "record-store": "Found at a record store",
            gift: "Gift",
            digital: "iTunes / Online",
            "random-discovery": "Random discovery",
            "life-phase": "It belongs to a specific life phase",
            completion: "Completion of an album or edition",
            "collection-essential": "Collection essential",
            unknown: "I don't remember",
            other: "Other reason",
        },
    },

    playerRotation: {
        label: "Player Rotation",
        title: (count: number) =>
            count > 0
                ? `${count} albums for the player`
                : "No player rotation yet",
        subtitle: {
            draft: "Review the suggestion before accepting it.",
            active: "A conscious selection from your collection.",
            empty: "Generate a rotation to get started.",
        },
        generate: "Generate Rotation",
        newSuggestion: "New Suggestion",
        accept: "Take With Me",
        handover: { title: "Change Rotation?", summary: (entering: number, leaving: number, unchanged: number) => `${entering} entering · ${leaving} leaving · ${unchanged} unchanged`, size: (size: number, target: number) => `${size} of up to ${target} Albums`, confirm: "Confirm and take along",error:"Handover preview could not be loaded.",missingQuota:(count:number)=>`${count} below quota`,exportEstimate:(size:string,files:number)=>`Estimated export: ${size} · ${files} files`,bindingWarning:(missing:number,unconfirmed:number)=>`${missing} missing and ${unconfirmed} unconfirmed Bindings`,acceptButNotExportable:"You may accept this Rotation, but Export remains blocked until its Bindings are ready." },
        remove: "Remove from Rotation",
        replace: "Replace",
        replaceTitle: "Replacement Candidates",
        empty: "No albums in rotation",
        emptyHint:
            "Once enough albums are categorized, Rotation can suggest a player selection.",
        explanation: {
            new: "This album wants to be discovered first.",
            growing: "This album grows a little more with every listen.",
            "comfort-food": "You keep coming back to this one.",
            classic: "This album has shaped you over time.",
            admire: "You value it — even if you don't reach for it often.",
            archive: "This album may rest.",
            noListenSession: "It's waiting for its first listen session.",
            notHeardRecently: "It hasn't been listened to in a while.",
            listenedOften: "You've listened to it a lot recently.",
            longInRole: "It has belonged to this role for a long time.",
            fillsPlan: "It complements the current selection.",
            recommendation: "It originally came into your collection through a recommendation.",
            memory: "A personal memory is attached to it.",
            default: "Part of the current rotation.",
        },
        tooltip: {
            listenSessions: (count: number) =>
                count === 1 ? "Listen Session" : "Listen Sessions",
            lastListened: "Last Listened",
        },
    },

    roleExplorer: {
        intro: "Every role tells a different story about your collection.",
        backToOverview: "← Back",
        backToOverviewAria: "Back to role overview",
        futureInsights:
            "Timeline of role, listening analysis and transition history coming soon.",
    },

    discoverAlbum: {
        eyebrow: "New arrival · Intake",
        title: "Create album record",
        subtitle: "Identify the find, complete its record, and preserve how it entered your life.",
        steps: {
            title: {
                label: "What is the album called?",
                placeholder: "Album Title",
            },
            artist: {
                label: "Who is the artist?",
                placeholder: "Artist",
            },
            year: {
                label: "Year",
                placeholder: "Release Year",
            },
            metadata: {
                title: "Add Album Data",
                description:
                    "Rotation can automatically add more information about your album.",
                coverFeature: "Album Cover",
                yearFeature: "Release Year",
                searching: "Searching…",
                searchingStatus: (appName: string) =>
                    `🎵 ${appName} is searching for your album …`,
                found: "Album data found and added.",
                successStatus:
                    "✅ Album data found. Cover and release year have been added.",
                notFound:
                    "No album data found. You can add the album normally anyway.",
                notFoundStatus:
                    "📦 Unfortunately no album data could be found. You can still add the album normally.",
                errorStatus:
                    "🌐 The album data could not be loaded right now. We'll continue anyway.",
                addData: "Add Album Data",
                skip: "Skip",
                moreInfo: "Search for more information about your album.",
                searchButton: "Search Album",
            },
            story: {
                title: "The personal trace",
                description: "These details are optional and can be edited at any time.",
                acquiredBecause: "Why did this album come to you?",
                lifePhase: "Which phase of life belongs to it?",
                memoryNote: "A note for later",
                memoryPlaceholder: "A place, a person, a moment, or simply how the first listen felt …",
                optional: "No answer",
            },
        },
        back: "Back",
        next: "Next",
        finish: "Finish",
    },

    common: {
        yes: "Yes",
        no: "No",
        loading: "Loading...",
        uploadImage: "Upload Image",
        album: "Album",
        albums: "Albums",
        coverOf: (title: string) => `Cover of ${title}`,
    },

    nav: {
        home: "Home",
        bindings: "Bindings",
        export: "Export",
        insights: "Insights",
        settings: "Settings",
        history: "History",
        offline: "Offline — waiting for connection",
        apiUnavailable: "Server unavailable — using local cache",
        retrying: "Retrying…",
        bindingsAttention: (count: number) => `${count} ${count === 1 ? "unbound album is" : "unbound albums are"} waiting for you`,
    },

    language: {
        label: "Language",
        de: "Deutsch",
        en: "English",
    },

    settings: {
        kicker: "Control room",
        title: "Settings",
        description: "Tune how Rotation works without changing the active selection unexpectedly.",
        composition: "Rotation composition",
        maximum: "Maximum Albums",
        quotaSum: (sum: number, maximum: number) => `Role quota sum: ${sum} · Maximum: ${maximum}`,
        appliesNext: "Changes apply when you generate the next Rotation.",
        save: "Save settings",
        saving: "Saving…",
        loadError: "Settings could not be loaded.",
        saveError: "Settings could not be saved.",
        undoTitle: "Last safe change", undoDescription: "Undo the latest role or Archive decision only while no conflicting change followed it.", undo: "Undo last role change", undoError: "The change can no longer be safely undone.", undoPreview: (album:string, role:string) => `${album} will be restored to the role “${role}”.`, undoConfirmTitle: "Restore this role?", undoConfirm: "Confirm restoration",
    },
    history: { title: "Rotation history", description: "Selections you deliberately took along.", empty: "No earlier Rotation yet.", loadError: "History could not be loaded.", archivedAt: (date: string) => `Archived ${new Date(date).toLocaleDateString()}`, albumCount: (count: number) => `${count} Albums`, previous: "Previous", next: "Next", exports:"Delivered exports",noExport:"This Rotation was not exported.",exportedAt:(date:string)=>`Exported ${new Date(date).toLocaleDateString()}`,useAsDraft:"Use as new suggestion",draftError:"A new draft could not be created." },

    exportPage: {
        title: "Export to Device",
        description:
            "Export your active rotation plan to the device sync folder. This copies the album folders to the Syncthing-managed directory.",
        preview: "Preview Export",
        noRotationPlan: "Generate and accept a rotation plan first.",
        calculating: "Calculating export preview...",
        albums: "Albums",
        totalSize: "Total Size",
        files: "Files",
        sourceArtist: "Artist",
        sourceAlbum: "Album",
        sourceFolder: "Source folder",
        missingBindings: "Missing bindings:",
        unconfirmedBindings: "Unconfirmed bindings:",
        issueReasons: {
            "album-not-found": "album is no longer in the Library",
            "binding-missing": "album has no filesystem binding",
            "binding-unconfirmed": "filesystem binding must be confirmed",
        },
        skippedAlbums: "Skipped albums:",
        skippedAlbumsDescription: (count: number) =>
            `${count} album(s) could not be copied.`,
        retryStaging: "Retry",
        continueAnyway: "Continue Anyway",
        stagingTimeout:
            "Export staging timed out. Please try again.",
        retryFromStep: "Retry from current step",
        resetAndStartOver: "Reset and start over",
        recoveryNotice: (info: { recovered: number; cleanedStagingDirs: number; cleanedArchives: number }) =>
            `A previous export was automatically recovered (${info.recovered} operations, ${info.cleanedStagingDirs} staging dirs cleaned, ${info.cleanedArchives} archives cleaned).`,
        crashRecoveryDismiss: "Dismiss",
        cancel: "Cancel",
        stage: "Stage Export",
        copyProgress: (copied: number, total: number) =>
            `${copied} / ${total} files`,
        copying: "Copying files...",
        apply: "Apply Export",
        applying: "Applying export...",
        success: "Export applied successfully!",
        previousExportArchived: (path: string) =>
            `Previous export archived to: ${path}`,
        done: "Done",
        error: (msg: string) => `Error: ${msg}`,
        reset: "Reset",
    },

    bindings: {
        title: "Album Bindings",
        sourceFolder: "Source folder",
        resolution: "Library resolution",
        filters: {
            unresolved:"Unresolved",
            all: "All",
            proposed: "Proposed",
            confirmed: "Confirmed",
            missing: "Missing",
        },
        resolver:{title:"Resolve album folder",kicker:"Unresolved folder",description:"Choose an existing Library Album or create a new entry. A successful choice confirms the Binding immediately.",open:"Resolve",create:"Create new Library Album",cancel:"Cancel"},
        state: {
            proposed: "Proposed",
            confirmed: "Confirmed",
            missing: "Missing",
        },
        confirm: "Confirm",
        delete: "Delete",
        error: "An error occurred. Please try again.",
        empty: "No bindings found.",
        confirmDelete: "Are you sure you want to delete this binding?",
        folderMissing: "Folder not found",
        verify: "Verify",
        reconcile: "Reconcile",
        scanNow: "Scan music folder",
        scanning: "Scanning music folder…",
        scanTooltip: "Scans the music folder now and creates bindings for newly found album folders",
        scanProgress: (scanned: number, skipped: number) =>
            `${scanned} directories scanned, ${skipped} skipped`,
        scanSuccess: "Music scan completed. Bindings have been refreshed.",
        scanFailed: "Music scan failed.",
        scanTimeout: "Music scan timed out. Check diagnostics and try again.",
        verifyTooltip:
            "Checks all confirmed bindings against the filesystem and marks missing folders",
        reconcileTooltip:
            "Promotes proposed bindings to confirmed when the folder still exists",
        verifyResult: (ok: number, missing: number) =>
            `${ok} confirmed, ${missing} missing`,
        reconcileResult: (count: number) =>
            `${count} proposed bindings confirmed`,
        orphanBadge: "Not in Library",
        albumPreview: (title: string, artist: string) =>
            `${title} by ${artist}`,
        orphanBanner: (count: number) =>
            count === 1
                ? "1 orphaned folder detected — review on Bindings page."
                : `${count} orphaned folders detected — review on Bindings page.`,
        capture: "Capture",
        captureSuccess: "Album captured and linked successfully.",
        coachSuccess: "Album role saved.",
        viewInLibrary: "View in Library",
        candidates: {
            review: "Review matches",
            select: "Select",
            reject: "Reject suggestions",
            manual: "Select another album from the Library",
            searchPlaceholder: "Search artist or title",
            none: "No reliable matches found. You can capture this as a new album instead.",
            confidence: { strong: "Very similar metadata", possible: "Possible match", ambiguous: "Ambiguous match" },
            reasons: {
                "title-exact": "Title matches",
                "title-similar": "Title is similar",
                "artist-exact": "Artist matches",
                "artist-similar": "Artist is similar",
                "volume-conflict": "Different volume number",
            },
        },
    },

    diagnostics: {
        error: "Error",
        loading: "Loading diagnostics...",
        allOk: "All systems operational",
        infoStatus: "Ready — no scan performed yet",
        issuesDetected: "Issues detected — show details",
        refresh: "Refresh",
        scanNow: "Scan folders",
        scanning: "Scanning…",
        scanningWithProgress: (scanned: number, skipped: number) =>
            `Scanning… (${scanned} directories scanned, ${skipped} skipped)`,
        scanQueued: "Scan started, please wait…",
        coverBatchSummary: (attempted: number, local: number, cached: number, missing: number, failed: number) =>
            `Cover resolution: ${attempted} checked, ${local} local, ${cached} cached, ${missing} missing, ${failed} failed`,
        database: "Database",
        databaseFail: "Not reachable",
        musicFolder: "Music folder",
        musicFolderMissing: "Not present",
        musicFolderNotReadable: "Not readable",
        workspaceFolder: "Workspace folder",
        workspaceFolderMissing: "Not present",
        workspaceFolderNotWritable: "Not writable",
        syncthingFolder: "Syncthing folder",
        syncthingFolderMissing: "Not present",
        syncthingFolderNotWritable: "Not writable",
        bindings: "Bindings",
        confirmed: "confirmed",
        proposed: "proposed",
        albumFolders: "album folders",
        ok: "OK",
        bindingsEmptyAfterScan: "No bindings found after last scan",
        bindingsNoScan: "No scan performed yet",
        lastScan: "Last scan",
        artworkProbeTitle: "Local artwork feasibility",
        artworkProbeDescription: "Read one bounded MP3, M4A, and FLAC sample from confirmed bindings. No paths, tags, or image data leave the server.",
        artworkProbeRun: "Run artwork test",
        artworkProbeRunning: "Testing artwork…",
        artworkProbeInspected: (count: number) => `${count} confirmed bindings inspected`,
        artworkProbeTime: (milliseconds: number) => `${milliseconds} ms`,
        artworkProbeMemory: (memory: string) => `RSS delta ${memory}`,
        artworkProbeCover: (size: string) => `Cover ${size}`,
        artworkProbeMissing: (formats: string) => `No bounded sample found for: ${formats}`,
        artworkProbeOutcome: {
            cover: "Embedded cover found",
            "no-cover": "No embedded cover",
            "parse-error": "Metadata could not be parsed",
        },
        playbackInventoryTitle: "Playback media inventory",
        playbackInventoryDescription: "Collects bounded technical audio and ordering evidence for confirmed albums. Private paths, filenames, and tag text never leave the server.",
        playbackInventoryRun: "Run media inventory",
        playbackInventoryRunning: "Inspecting media…",
        playbackInventorySummary: (bindings: number, albums: number, files: number) =>
            `${bindings} bindings inspected, ${albums} albums and ${files} audio files recorded`,
        playbackInventoryFiles: (count: number) => `${count} files`,
        playbackInventoryMedia: (containers: string, codecs: string) => `Containers ${containers}; codecs ${codecs}`,
        playbackInventoryAudioProfile: (sampleRates: string, bitDepths: string) => `Sample rates ${sampleRates} Hz; bit depths ${bitDepths}`,
        playbackInventoryLargest: (size: string) => `Largest file ${size}`,
        playbackInventoryCoverage: (tracks: number, titles: number, durations: number, files: number) =>
            `Tags: track ${tracks}/${files}, title ${titles}/${files}, duration ${durations}/${files}`,
        playbackInventoryFallback: (count: number) => `${count} require filename fallback`,
        playbackInventoryErrors: (count: number) => `${count} parse errors`,
        playbackInventoryOrdering: (multiDisc: number, ambiguous: number) =>
            `${multiDisc} multi-disc albums, ${ambiguous} albums with ambiguous ordering`,
    },
}

type Stringify<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => string
        ? (...args: A) => string
        : T[K] extends object
          ? Stringify<T[K]>
          : string
}

export type Translation = Stringify<typeof en>
