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
    },

    reflection: {
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
            ourRecommendation: "Our Recommendation",
            roleAssigned: (roleTitle: string) =>
                `The role "${roleTitle}" fits this album well.`,
            accept: "Accept Role",
        },
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
