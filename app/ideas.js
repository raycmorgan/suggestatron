module.exports = function (app) {
  
  app.get('/ideas/random/:amount', function (req, res) {
    res.writeHead(200, {});
    
    
    var n = 0,
        ids = [],
        ideas = [];
    
    for (var i = 0; i < req.params.amount; i++) {
      APP.redisClient.srandmember('ideas:ids', function (err, id) {
        ids.push(id);
        
        if (++n == req.params.amount) {
          n = 0;
          
          for (var i = 0; i < ids.length; i++) {
            APP.redisClient.hgetall('ideas:' + ids[i], function (err, idea) {
              ideas.push(idea);
              
              if (++n == ids.length) {
                var seen = {};
                
                ideas = ideas.filter(function (idea) {
                  if (!seen[idea.id]) {
                    seen[idea.id] = true;
                    return true;
                  }
                  
                  return false;
                });
                
                // console.log(ideas);
                
                res.end(JSON.stringify(ideas));
              }
            });
          }
          
        }
      });
    }
  });
  
}
