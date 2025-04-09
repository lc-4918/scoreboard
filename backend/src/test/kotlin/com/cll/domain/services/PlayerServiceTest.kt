package com.cll.domain.services

import com.cll.domain.entity.Player
import com.cll.domain.ports.PlayerRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import org.bson.BsonObjectId
import org.bson.types.ObjectId
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlayerServiceTest {
    private val playerRepository = mockk<PlayerRepository>(relaxed = true)
    private val playerService = PlayerService(playerRepository)

    @Test
    fun `test findByIdWithRanking`() = runBlocking {
        // Arrange
        val playerId = ObjectId()
        val player = Player(playerId, "testPlayer", 100)
        val sortedPlayers = listOf(player)

        coEvery { playerRepository.findById(playerId) } returns player
        coEvery { playerRepository.getAllPlayersSortedByPointsDescending() } returns sortedPlayers

        // Act
        val result = playerService.findByIdWithRanking(playerId)
        
        // Assert
        assertEquals("testPlayer", result?.username)
        assertEquals(100, result?.points)
        assertEquals(1, result?.ranking)
        
        // Verify
        coVerify { 
            playerRepository.findById(playerId)
            playerRepository.getAllPlayersSortedByPointsDescending() 
        }
    }

    @Test
    fun `test findByIdWithRanking when player not found`() = runBlocking {
        // Arrange
        val playerId = ObjectId()
        coEvery { playerRepository.findById(playerId) } returns null

        // Act
        val result = playerService.findByIdWithRanking(playerId)
        
        // Assert
        assertNull(result)
        
        // Verify
        coVerify { playerRepository.findById(playerId) }
    }

    @Test
    fun `test insertOnePlayer`() = runBlocking {
        // Arrange
        val playerId = ObjectId()
        val player = Player(playerId, "testPlayer", 100)
        coEvery { playerRepository.insertOne(player) } returns BsonObjectId(playerId)

        // Act
        val result = playerService.insertOnePlayer(player)
        
        // Assert
        assertEquals(player.id, (result as BsonObjectId).value)
        
        // Verify
        coVerify { playerRepository.insertOne(player) }
    }

    @Test
    fun `test deleteById`() = runBlocking {
        // Arrange
        val playerId = ObjectId()
        coEvery { playerRepository.deleteById(playerId) } returns 1

        // Act
        val result = playerService.deleteById(playerId)
        
        // Assert
        assertEquals(1, result)
        
        // Verify
        coVerify { playerRepository.deleteById(playerId) }
    }

    @Test
    fun `test updateOnePlayerPoints`() = runBlocking {
        // Arrange
        val playerId = ObjectId()
        coEvery { playerRepository.updateOnePlayerPoints(playerId, 150) } returns 1

        // Act
        val result = playerService.updateOnePlayerPoints(playerId, 150)
        
        // Assert
        assertEquals(1, result)
        
        // Verify
        coVerify { playerRepository.updateOnePlayerPoints(playerId, 150) }
    }

    @Test
    fun `test getAllPlayersSortedByPointsDesc`() = runBlocking {
        // Arrange
        val player = Player(ObjectId(), "testPlayer", 100)
        val sortedPlayers = listOf(player)
        val sortedResponsePlayers = listOf(player.toResponse(1))
        coEvery { playerRepository.getAllPlayersSortedByPointsDescending() } returns sortedPlayers

        // Act
        val result = playerService.getAllPlayersSortedByPointsDesc()
        
        // Assert
        assertEquals(sortedResponsePlayers, result)
        
        // Verify
        coVerify { playerRepository.getAllPlayersSortedByPointsDescending() }
    }

    @Test
    fun `test deleteAll`() = runBlocking {
        // Arrange
        coEvery { playerRepository.deleteAll() } returns 10

        // Act
        val result = playerService.deleteAll()
        
        // Assert
        assertEquals(10, result)
        
        // Verify
    }
}