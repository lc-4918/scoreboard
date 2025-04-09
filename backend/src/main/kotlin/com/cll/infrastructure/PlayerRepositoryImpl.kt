package com.cll.infrastructure

import com.cll.domain.entity.Player
import com.cll.domain.ports.PlayerRepository
import com.mongodb.MongoException
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Sorts
import com.mongodb.client.model.Updates
import com.mongodb.kotlin.client.coroutine.MongoDatabase
import io.ktor.util.logging.KtorSimpleLogger
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.withContext
import org.bson.BsonDocument
import org.bson.BsonValue
import org.bson.types.ObjectId

class PlayerRepositoryImpl (
    private val mongoDatabase: MongoDatabase,
    // Les répartiteurs injectables facilitent les tests en permettant aux tests d'injecter des répartiteurs plus déterministes
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) : PlayerRepository {

    private val logger = KtorSimpleLogger("com.cll.infrastructure.repository.PlayerRepositoryImpl")

    companion object {
        const val PLAYER_COLLECTION = "tourney"
    }

    override suspend fun insertOne(player: Player): BsonValue? {
        try {
            // withContext exécute les opérations I/O dans un thread dédié pour libérer le thread principal
            // (thread UI dans le cas d'applications Android) et éviter le gel de l'interface utilisateur
            // pendant l'opération en cours
            return withContext(dispatcher) {
                val result = mongoDatabase.getCollection<Player>(PLAYER_COLLECTION).insertOne(player)
                result.insertedId
            }
        } catch (e: MongoException) {
            // En cas d'erreur, enregistre l'erreur et retourne 0
            logger.error("Unable to insert due to an error: $e")
        }
        return null
    }

    override suspend fun deleteById(objectId: ObjectId): Long {
        try{
            return withContext(dispatcher) {
                val result = mongoDatabase.getCollection<Player>(PLAYER_COLLECTION).deleteOne(Filters.eq("_id", objectId))
                result.deletedCount
            }
        }catch (e: MongoException) {
            logger.error("Unable to delete due to an error: $e")
        }
        return 0
    }

    override suspend fun findById(objectId: ObjectId): Player? =
        withContext(dispatcher) {
            val result = mongoDatabase.getCollection<Player>(PLAYER_COLLECTION).withDocumentClass<Player>()
                .find(Filters.eq("_id", objectId)).toList()
                    result.firstOrNull()
        }


    override suspend fun updateOnePlayerPoints(objectId: ObjectId, points: Int): Long {
        try {
            return withContext(dispatcher) {
                val result = mongoDatabase.getCollection<Player>(PLAYER_COLLECTION).updateOne(
                    Filters.eq("_id", objectId),
                    Updates.inc("points", points)
                )
                result.modifiedCount
            }
        } catch (e: MongoException) {
            logger.error("Unable to update due to an error: $e")
        }
        return 0
    }

    override suspend fun deleteAll(): Long {
        try {
            return withContext(dispatcher) {
                val result = mongoDatabase.getCollection<Player>(PLAYER_COLLECTION).deleteMany(BsonDocument())
                result.deletedCount
            }
        } catch (e: MongoException) {
            logger.error("An error occurred while deleting all players: $e")
        }
        return 0
    }

    override suspend fun getAllPlayersSortedByPointsDescending(): List<Player> {
        try {
            return withContext(dispatcher) {
                mongoDatabase.getCollection<Player>(PLAYER_COLLECTION).withDocumentClass<Player>().find()
                    .sort(Sorts.descending("points")).toList()
            }
        } catch (e: MongoException) {
            logger.error("An error occurred while retrieving players: $e")
        }
        return emptyList()
    }

}