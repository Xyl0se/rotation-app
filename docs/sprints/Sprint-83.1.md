# Sprint 83 — Reflection Inbox

**Status:** 

**Target version:** 

**Type:** 
---

## Goal

Slight Rework of Album Coach and Bindings page itself.

## Product Decision

### Draft by User: 
This sprint serves the purpose to rework the album coach. Over the course of using the coach to place about a hundred albums in a role it has become evident, that the current way is too tedious. The Coach should consist of three pages in the future:
- Intro (same as today)
- Coach
- Result

The thing about the coach itself is where the brainwork has to go: The coach should ask just a few questions (yes/no questions), or present the user with a couple of sliders like:
- album rating (1to5 stars)
- in possession for how long (rough)
- listened how many times (binary --> more than three, up to three)
- etc...

--> based on the results of these questions the coach should then make an assumption about the albums role.

On the results page, the user should be presented with the "main" result, BUT they should have a chance to change the role via a set of simple buttons.

Second topic is the bindings page. Currently the only function this page has, is to help the user bind unbound albums to library entries and/or create the library entry alltogether. But the cards feature way too many buttons. So first of all there should only be one button OR (and I prefer that option): The card itself is the button, a click on it opens the album discovery dialogue. Also, after finishing the dialogue, the card should automatically be akcnowledged, there shouldnt be a manual approval. This in turn also necessitates the main view of the bindings page to be the unbound albums. The default view should ONLY switch to all albums, once there arent any unbound albums.

Third topic is catching some fringe cases of the album cover search. I found that for an album containing a '+' sign in the name (Smoke + Mirrors) the album result stays empty.

## Workstreams 

## Definition of Done

- [ ] 

## Non-Goals


