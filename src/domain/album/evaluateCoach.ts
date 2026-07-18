import { determineRole,type AlbumCoachAnswers,type CoachRecommendation } from "./determineRole"
export type CoachEvaluation={finished:false;nextQuestion:"snapshot"}|({finished:true}&CoachRecommendation)
export function evaluateCoach(answers:AlbumCoachAnswers):CoachEvaluation{try{return{finished:true,...determineRole(answers)}}catch{return{finished:false,nextQuestion:"snapshot"}}}
