package com.cll.domain.ports

import com.cll.domain.entity.Player
import com.mongodb.MongoException
import org.bson.BsonValue
import org.bson.types.ObjectId

interface PlayerRepository {

    // Les exceptions non vérifiées ne sont pas obligées d'être déclarées dans la signature de méthode.
    // Ces exceptions seront captées plus haut dans la pile d'appel.
    // Utilisation de @Throws dans l'interface du repository dans le seul but de documenter le contrat de l'API
    // Et d'informer l'utilisateur des exceptions possibles
    @Throws(MongoException::class)
    suspend fun insertOne(player: Player): BsonValue?

    @Throws(MongoException::class)
    suspend fun deleteById(objectId: ObjectId): Long

    @Throws(MongoException::class)
    suspend fun findById(objectId: ObjectId): Player?

    @Throws(MongoException::class)
    suspend fun updateOnePlayerPoints(objectId: ObjectId, points: Int): Long

    @Throws(MongoException::class)
    suspend fun deleteAll(): Long

    @Throws(MongoException::class)
    suspend fun getAllPlayersSortedByPointsDescending(): List<Player>
}