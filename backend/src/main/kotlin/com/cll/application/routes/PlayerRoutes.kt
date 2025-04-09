package com.cll.application.routes

import com.cll.application.request.PlayerRequest
import com.cll.application.request.toDomain
import com.cll.domain.services.PlayerService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.Route
import io.ktor.server.routing.route
import io.ktor.server.routing.post
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import org.bson.types.ObjectId
import org.koin.ktor.ext.inject

fun Route.playerRoutes() {
    val playerService by inject<PlayerService>()
    val id = "/{id?}"

    route("player") {
        post {
            val player = call.receive<PlayerRequest>()
            val insertedId = playerService.insertOnePlayer(player.toDomain())
            call.respond(HttpStatusCode.Created, mapOf(
                "message" to "Player created successfully",
                "id" to insertedId.toString()
            ))
        }
        delete(id) {
            val playerId = call.extractParameter("id") ?: return@delete
            val delete: Long = playerService.deleteById(ObjectId(playerId))
            if (delete == 1L) {
                return@delete call.respond(HttpStatusCode.OK, mapOf("message" to "Player deleted successfully"))
            }
            return@delete call.respond(HttpStatusCode.NotFound, mapOf("message" to "Player not found"))
        }
        get(id) {
            val playerId = call.extractParameter("id") ?: return@get
            // Utilisation de let superflue (aucune manipulation à faire)
            // Elle sert uniquement à montrer mes capacités de rédaction
            playerService.findByIdWithRanking(ObjectId(playerId))?.let {
                foundPlayer -> call.respond(foundPlayer)
            } ?: call.respond(HttpStatusCode.NotFound, mapOf("message" to "No records found for id $playerId"))
        }
        patch(id) {
            val playerId = call.extractParameter("id") ?: return@patch
            val points = call.extractParameter("points") ?: return@patch
            val updated = playerService.updateOnePlayerPoints(ObjectId(playerId), points.toInt())
            if (updated == 1L) {
                call.respond(HttpStatusCode.OK, mapOf(
                    "message" to "Player updated successfully",
                    "success" to true
                ))
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf(
                    "message" to "Player not found",
                    "success" to false
                ))
            }
        }
    }
    route("players") {
        get {
            val sortedPlayers = playerService.getAllPlayersSortedByPointsDesc()
            call.respond(sortedPlayers)
        }
        delete {
            val deletedCount = playerService.deleteAll()
            call.respond(mapOf(
                "message" to "Players deleted successfully",
                "count" to deletedCount
            ))
        }
        post("match") {
            val player1Id = call.extractParameter("player1Id") ?: return@post
            val player2Id = call.extractParameter("player2Id") ?: return@post
            val updatedRanking = playerService.simulateMatch(ObjectId(player1Id), ObjectId(player2Id))
            call.respond(updatedRanking)
        }
    }
}

private suspend fun ApplicationCall.extractParameter(name: String): String? {
    val paramValue = this.parameters[name]
    if (paramValue.isNullOrEmpty()) {
        this.respond(HttpStatusCode.BadRequest, mapOf("message" to "Missing $name parameter"))
        return null
    }
    return paramValue
}