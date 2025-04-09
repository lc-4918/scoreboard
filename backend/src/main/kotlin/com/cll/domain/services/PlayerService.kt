package com.cll.domain.services

import com.cll.application.response.PlayerResponse
import com.cll.domain.entity.Player
import com.cll.domain.ports.PlayerRepository
import org.bson.BsonValue
import org.bson.types.ObjectId

class PlayerService(
    private val playerRepository: PlayerRepository
) {
    suspend fun findByIdWithRanking(id: ObjectId): PlayerResponse? {
        val player = playerRepository.findById(id) ?: return null
        val sortedPlayers = playerRepository.getAllPlayersSortedByPointsDescending()
        val ranking = sortedPlayers.indexOf(player) + 1
        return player.toResponse(ranking)
    }

    suspend fun insertOnePlayer(player: Player): BsonValue? = playerRepository.insertOne(player)
    suspend fun deleteById(objectId: ObjectId): Long = playerRepository.deleteById(objectId)
    suspend fun updateOnePlayerPoints(objectId: ObjectId, points: Int): Long =
        playerRepository.updateOnePlayerPoints(objectId, points)

    suspend fun getAllPlayersSortedByPointsDesc(): List<PlayerResponse> {
        val sortedPlayers = playerRepository.getAllPlayersSortedByPointsDescending()
        return sortedPlayers.mapIndexed { index, player ->
            player.toResponse(index + 1)
        }
    }

    suspend fun deleteAll(): Long = playerRepository.deleteAll()

    suspend fun simulateMatch(player1Id: ObjectId, player2Id: ObjectId): List<PlayerResponse> {
        // Sélection aléatoire du gagnant
        val winnerId = if (Math.random() < 0.5) player1Id else player2Id
        playerRepository.updateOnePlayerPoints(winnerId, 1)
        return getAllPlayersSortedByPointsDesc()
    }
}