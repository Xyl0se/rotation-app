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
        version: "Version 0.1",
    },

    header: {
        title: "Rotation",
    },

    home: {
        suggestFocusAlbum: "Suggest New Focus Album",
        discoverAlbum: "Discover New Album",
    },

    emptyLibrary: {
        title: "No albums yet",
        description:
            "Begin your personal music collection by adding your first album.",
        cta: "Discover New Album",
        orImport: "Or import an existing backup:",
    },

    focusAlbum: {
        label: "Focus Album",
        roleSince: "Current role since",
        listenCountLabel: "Listen Sessions",
        lastListenedLabel: "Last Listened",
        noListenSession: "No listen session yet",
        listened: "Listened",
    },

    albumStory: {
        why: "Why",
        when: "When",
    },

    acquisitionReasons: {
        artist: "Artist",
        "friend-recommendation": "Recommendation",
        "specific-song": "Song",
        concert: "Concert",
        review: "Review",
        "record-store": "Record Store",
        gift: "Gift",
        "random-discovery": "Random Discovery",
        "life-phase": "Life Phase",
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
        other: "Other",
    },

    dashboard: {
        title: "Dashboard",
        subtitle: "What deserves attention right now.",
        nextQuestion: "Next Question",
        insights: "Insights",
        roleOverview: "Role Overview",
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
    },

    reflection: {
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
        questions: {
            heardThreeTimes: {
                title: "Have you listened to this album at least three times consciously?",
                description:
                    "Only after several listens does a reliable impression usually form.",
            },
            wouldMissAlbum: {
                title: "Would you miss this album if it were no longer available tomorrow?",
                description: "",
            },
            stillReturningConsciously: {
                title: "Do you still consciously return to this album today?",
                description: "",
            },
            shapedTasteLongterm: {
                title:
                    "Has this album accompanied you over a longer period or shaped your taste in music?",
                description:
                    "Personal classics persist even when played less frequently.",
            },
            reachesAutomatically: {
                title:
                    "Do you sometimes reach for this album completely automatically, without thinking much about your music choice?",
                description:
                    "Comfort-food albums feel familiar and accompany you reliably.",
            },
            surprisedLastListen: {
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
            memoryOfEarlierPhase: {
                title: "Is it mainly a memory of an earlier phase?",
                description: "",
            },
        },
        result: {
            ourRecommendation: "Our Recommendation",
            roleAssigned: (roleTitle: string) =>
                `The role "${roleTitle}" fits this album well.`,
            accept: "Accept Role",
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
    },

    albumCard: {
        archiveLabel: "Archive",
        listened: "Listened",
        listenCount: (count: number) => `${count}x listened`,
        setFocus: "Set Focus",
        edit: "Edit Album",
        archive: "Move to Archive",
        reconsider: "Check Rediscovery",
        delete: "Delete Album",
    },

    deleteDialog: {
        title: "Really delete album?",
        description:
            "This album will be permanently removed from your library. This action cannot be undone.",
        confirm: "Yes, Delete",
        cancel: "Cancel",
    },

    editDialog: {
        title: "Edit Album Metadata",
        subtitle: "Correct the metadata of this album. The role remains unchanged.",
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
            "random-discovery": "Random discovery",
            "life-phase": "It belongs to a specific life phase",
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
        },
        back: "Back",
        next: "Next",
        finish: "Finish",
    },

    backup: {
        export: "Export",
        import: "Import",
        exportSuccess: "Backup downloaded.",
        importSuccess:
            "Backup successfully restored. Page will reload...",
        importDialog: {
            title: "Import Backup",
            description: (fileName: string) =>
                `Do you really want to import the backup ${fileName}?`,
            warning:
                "All existing data will be overwritten. This action cannot be undone.",
            import: "Import",
            cancel: "Cancel",
        },
        errors: {
            invalidFormat: "Invalid backup format.",
            noSchemaVersion: "Backup has no valid schema version.",
            noDate: "Backup has no valid export date.",
            noData: "Backup contains no valid data.",
            invalidJson: "Invalid JSON file.",
            readError: "File could not be read.",
            generic: "Error restoring backup.",
        },
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
        offline: "Offline — waiting for connection",
        retrying: "Retrying…",
    },

    language: {
        label: "Language",
        de: "Deutsch",
        en: "English",
    },

    writeToken: {
        title: "Write Token",
        description:
            "Enter the ROTATION_WRITE_TOKEN from your server environment to enable write operations like scanning and exporting.",
        placeholder: "Paste token here...",
        save: "Save",
        clear: "Clear",
        saved: "Saved",
    },

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
        missingBindings: "Missing bindings:",
        unconfirmedBindings: "Unconfirmed bindings:",
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
        filters: {
            all: "All",
            proposed: "Proposed",
            confirmed: "Confirmed",
            missing: "Missing",
        },
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
        verifyTooltip:
            "Checks all confirmed bindings against the filesystem and marks missing folders",
        reconcileTooltip:
            "Promotes proposed bindings to confirmed when the folder still exists",
        verifyResult: (ok: number, missing: number) =>
            `${ok} confirmed, ${missing} missing`,
        reconcileResult: (count: number) =>
            `${count} proposed bindings confirmed`,
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
