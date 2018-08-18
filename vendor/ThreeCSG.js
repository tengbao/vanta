'use strict';
window.ThreeBSP = (function() {
  
  var ThreeBSP,
    EPSILON = 1e-5,
    COPLANAR = 0,
    FRONT = 1,
    BACK = 2,
    SPANNING = 3;
  
  ThreeBSP = function( geometry ) {
    // Convert THREE.Geometry to ThreeBSP
    var i, _length_i,
      face, vertex, faceVertexUvs, uvs,
      polygon,
      polygons = [],
      tree;
  
    if ( geometry instanceof THREE.Geometry ) {
      this.matrix = new THREE.Matrix4;
    } else if ( geometry instanceof THREE.Mesh ) {
      // #todo: add hierarchy support
      geometry.updateMatrix();
      this.matrix = geometry.matrix.clone();
      geometry = geometry.geometry;
    } else if ( geometry instanceof ThreeBSP.Node ) {
      this.tree = geometry;
      this.matrix = new THREE.Matrix4;
      return this;
    } else {
      throw 'ThreeBSP: Given geometry is unsupported';
    }
  
    for ( i = 0, _length_i = geometry.faces.length; i < _length_i; i++ ) {
      face = geometry.faces[i];
      faceVertexUvs = geometry.faceVertexUvs[0][i];
      polygon = new ThreeBSP.Polygon;
      
      if ( face instanceof THREE.Face3 ) {
        vertex = geometry.vertices[ face.a ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[0].x, faceVertexUvs[0].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[0], uvs );
        vertex.applyMatrix4(this.matrix);
        polygon.vertices.push( vertex );
        
        vertex = geometry.vertices[ face.b ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[1].x, faceVertexUvs[1].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[1], uvs );
        vertex.applyMatrix4(this.matrix);
        polygon.vertices.push( vertex );
        
        vertex = geometry.vertices[ face.c ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[2].x, faceVertexUvs[2].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[2], uvs );
        vertex.applyMatrix4(this.matrix);
        polygon.vertices.push( vertex );
      } else if ( typeof THREE.Face4 ) {
        vertex = geometry.vertices[ face.a ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[0].x, faceVertexUvs[0].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[0], uvs );
        vertex.applyMatrix4(this.matrix);
        polygon.vertices.push( vertex );
        
        vertex = geometry.vertices[ face.b ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[1].x, faceVertexUvs[1].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[1], uvs );
        vertex.applyMatrix4(this.matrix);
        polygon.vertices.push( vertex );
        
        vertex = geometry.vertices[ face.c ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[2].x, faceVertexUvs[2].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[2], uvs );
        vertex.applyMatrix4(this.matrix);
        polygon.vertices.push( vertex );
        
        vertex = geometry.vertices[ face.d ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[3].x, faceVertexUvs[3].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[3], uvs );
        vertex.applyMatrix4(this.matrix);
        polygon.vertices.push( vertex );
      } else {
        throw 'Invalid face type at index ' + i;
      }
      
      polygon.calculateProperties();
      polygons.push( polygon );
    };
  
    this.tree = new ThreeBSP.Node( polygons );
  };
  ThreeBSP.prototype.subtract = function( other_tree ) {
    var a = this.tree.clone(),
      b = other_tree.tree.clone();
    
    a.invert();
    a.clipTo( b );
    b.clipTo( a );
    b.invert();
    b.clipTo( a );
    b.invert();
    a.build( b.allPolygons() );
    a.invert();
    a = new ThreeBSP( a );
    a.matrix = this.matrix;
    return a;
  };
  ThreeBSP.prototype.union = function( other_tree ) {
    var a = this.tree.clone(),
      b = other_tree.tree.clone();
    
    a.clipTo( b );
    b.clipTo( a );
    b.invert();
    b.clipTo( a );
    b.invert();
    a.build( b.allPolygons() );
    a = new ThreeBSP( a );
    a.matrix = this.matrix;
    return a;
  };
  ThreeBSP.prototype.intersect = function( other_tree ) {
    var a = this.tree.clone(),
      b = other_tree.tree.clone();
    
    a.invert();
    b.clipTo( a );
    b.invert();
    a.clipTo( b );
    b.clipTo( a );
    a.build( b.allPolygons() );
    a.invert();
    a = new ThreeBSP( a );
    a.matrix = this.matrix;
    return a;
  };
  ThreeBSP.prototype.toGeometry = function() {
    var i, j,
      matrix = new THREE.Matrix4().getInverse( this.matrix ),
      geometry = new THREE.Geometry(),
      polygons = this.tree.allPolygons(),
      polygon_count = polygons.length,
      polygon, polygon_vertice_count,
      vertice_dict = {},
      vertex_idx_a, vertex_idx_b, vertex_idx_c,
      vertex, face,
      verticeUvs;
  
    for ( i = 0; i < polygon_count; i++ ) {
      polygon = polygons[i];
      polygon_vertice_count = polygon.vertices.length;
      
      for ( j = 2; j < polygon_vertice_count; j++ ) {
        verticeUvs = [];
        
        vertex = polygon.vertices[0];
        verticeUvs.push( new THREE.Vector2( vertex.uv.x, vertex.uv.y ) );
        vertex = new THREE.Vector3( vertex.x, vertex.y, vertex.z );
        vertex.applyMatrix4(matrix);
        
        if ( typeof vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] !== 'undefined' ) {
          vertex_idx_a = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ];
        } else {
          geometry.vertices.push( vertex );
          vertex_idx_a = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] = geometry.vertices.length - 1;
        }
        
        vertex = polygon.vertices[j-1];
        verticeUvs.push( new THREE.Vector2( vertex.uv.x, vertex.uv.y ) );
        vertex = new THREE.Vector3( vertex.x, vertex.y, vertex.z );
        vertex.applyMatrix4(matrix);
        if ( typeof vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] !== 'undefined' ) {
          vertex_idx_b = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ];
        } else {
          geometry.vertices.push( vertex );
          vertex_idx_b = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] = geometry.vertices.length - 1;
        }
        
        vertex = polygon.vertices[j];
        verticeUvs.push( new THREE.Vector2( vertex.uv.x, vertex.uv.y ) );
        vertex = new THREE.Vector3( vertex.x, vertex.y, vertex.z );
        vertex.applyMatrix4(matrix);
        if ( typeof vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] !== 'undefined' ) {
          vertex_idx_c = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ];
        } else {
          geometry.vertices.push( vertex );
          vertex_idx_c = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] = geometry.vertices.length - 1;
        }
        
        face = new THREE.Face3(
          vertex_idx_a,
          vertex_idx_b,
          vertex_idx_c,
          new THREE.Vector3( polygon.normal.x, polygon.normal.y, polygon.normal.z )
        );
        
        geometry.faces.push( face );
        geometry.faceVertexUvs[0].push( verticeUvs );
      }
      
    }
    return geometry;
  };
  ThreeBSP.prototype.toMesh = function( material ) {
    var geometry = this.toGeometry(),
      mesh = new THREE.Mesh( geometry, material );
    
    mesh.position.setFromMatrixPosition( this.matrix );
    mesh.rotation.setFromRotationMatrix( this.matrix );
    
    return mesh;
  };
  
  
  ThreeBSP.Polygon = function( vertices, normal, w ) {
    if ( !( vertices instanceof Array ) ) {
      vertices = [];
    }
    
    this.vertices = vertices;
    if ( vertices.length > 0 ) {
      this.calculateProperties();
    } else {
      this.normal = this.w = undefined;
    }
  };
  ThreeBSP.Polygon.prototype.calculateProperties = function() {
    var a = this.vertices[0],
      b = this.vertices[1],
      c = this.vertices[2];
      
    this.normal = b.clone().subtract( a ).cross(
      c.clone().subtract( a )
    ).normalize();
    
    this.w = this.normal.clone().dot( a );
    
    return this;
  };
  ThreeBSP.Polygon.prototype.clone = function() {
    var i, vertice_count,
      polygon = new ThreeBSP.Polygon;
    
    for ( i = 0, vertice_count = this.vertices.length; i < vertice_count; i++ ) {
      polygon.vertices.push( this.vertices[i].clone() );
    };
    polygon.calculateProperties();
    
    return polygon;
  };
  
  ThreeBSP.Polygon.prototype.flip = function() {
    var i, vertices = [];
    
    this.normal.multiplyScalar( -1 );
    this.w *= -1;
    
    for ( i = this.vertices.length - 1; i >= 0; i-- ) {
      vertices.push( this.vertices[i] );
    };
    this.vertices = vertices;
    
    return this;
  };
  ThreeBSP.Polygon.prototype.classifyVertex = function( vertex ) {  
    var side_value = this.normal.dot( vertex ) - this.w;
    
    if ( side_value < -EPSILON ) {
      return BACK;
    } else if ( side_value > EPSILON ) {
      return FRONT;
    } else {
      return COPLANAR;
    }
  };
  ThreeBSP.Polygon.prototype.classifySide = function( polygon ) {
    var i, vertex, classification,
      num_positive = 0,
      num_negative = 0,
      vertice_count = polygon.vertices.length;
    
    for ( i = 0; i < vertice_count; i++ ) {
      vertex = polygon.vertices[i];
      classification = this.classifyVertex( vertex );
      if ( classification === FRONT ) {
        num_positive++;
      } else if ( classification === BACK ) {
        num_negative++;
      }
    }
    
    if ( num_positive > 0 && num_negative === 0 ) {
      return FRONT;
    } else if ( num_positive === 0 && num_negative > 0 ) {
      return BACK;
    } else if ( num_positive === 0 && num_negative === 0 ) {
      return COPLANAR;
    } else {
      return SPANNING;
    }
  };
  ThreeBSP.Polygon.prototype.splitPolygon = function( polygon, coplanar_front, coplanar_back, front, back ) {
    var classification = this.classifySide( polygon );
    
    if ( classification === COPLANAR ) {
      
      ( this.normal.dot( polygon.normal ) > 0 ? coplanar_front : coplanar_back ).push( polygon );
      
    } else if ( classification === FRONT ) {
      
      front.push( polygon );
      
    } else if ( classification === BACK ) {
      
      back.push( polygon );
      
    } else {
      
      var vertice_count,
        i, j, ti, tj, vi, vj,
        t, v,
        f = [],
        b = [];
      
      for ( i = 0, vertice_count = polygon.vertices.length; i < vertice_count; i++ ) {
        
        j = (i + 1) % vertice_count;
        vi = polygon.vertices[i];
        vj = polygon.vertices[j];
        ti = this.classifyVertex( vi );
        tj = this.classifyVertex( vj );
        
        if ( ti != BACK ) f.push( vi );
        if ( ti != FRONT ) b.push( vi );
        if ( (ti | tj) === SPANNING ) {
          t = ( this.w - this.normal.dot( vi ) ) / this.normal.dot( vj.clone().subtract( vi ) );
          v = vi.interpolate( vj, t );
          f.push( v );
          b.push( v );
        }
      }
      
      
      if ( f.length >= 3 ) front.push( new ThreeBSP.Polygon( f ).calculateProperties() );
      if ( b.length >= 3 ) back.push( new ThreeBSP.Polygon( b ).calculateProperties() );
    }
  };
  
  ThreeBSP.Vertex = function( x, y, z, normal, uv ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.normal = normal || new THREE.Vector3;
    this.uv = uv || new THREE.Vector2;
  };
  ThreeBSP.Vertex.prototype.clone = function() {
    return new ThreeBSP.Vertex( this.x, this.y, this.z, this.normal.clone(), this.uv.clone() );
  };
  ThreeBSP.Vertex.prototype.add = function( vertex ) {
    this.x += vertex.x;
    this.y += vertex.y;
    this.z += vertex.z;
    return this;
  };
  ThreeBSP.Vertex.prototype.subtract = function( vertex ) {
    this.x -= vertex.x;
    this.y -= vertex.y;
    this.z -= vertex.z;
    return this;
  };
  ThreeBSP.Vertex.prototype.multiplyScalar = function( scalar ) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  };
  ThreeBSP.Vertex.prototype.cross = function( vertex ) {
    var x = this.x,
      y = this.y,
      z = this.z;

    this.x = y * vertex.z - z * vertex.y;
    this.y = z * vertex.x - x * vertex.z;
    this.z = x * vertex.y - y * vertex.x;
    
    return this;
  };
  ThreeBSP.Vertex.prototype.normalize = function() {
    var length = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
    
    this.x /= length;
    this.y /= length;
    this.z /= length;
    
    return this;
  };
  ThreeBSP.Vertex.prototype.dot = function( vertex ) {
    return this.x * vertex.x + this.y * vertex.y + this.z * vertex.z;
  };
  ThreeBSP.Vertex.prototype.lerp = function( a, t ) {
    this.add(
      a.clone().subtract( this ).multiplyScalar( t )
    );
    
    this.normal.add(
      a.normal.clone().sub( this.normal ).multiplyScalar( t )
    );
    
    this.uv.add(
      a.uv.clone().sub( this.uv ).multiplyScalar( t )
    );
    
    return this;
  };
  ThreeBSP.Vertex.prototype.interpolate = function( other, t ) {
    return this.clone().lerp( other, t );
  };
  ThreeBSP.Vertex.prototype.applyMatrix4 = function ( m ) {

    // input: THREE.Matrix4 affine matrix

    var x = this.x, y = this.y, z = this.z;

    var e = m.elements;

    this.x = e[0] * x + e[4] * y + e[8]  * z + e[12];
    this.y = e[1] * x + e[5] * y + e[9]  * z + e[13];
    this.z = e[2] * x + e[6] * y + e[10] * z + e[14];

    return this;

  }
  
  
  ThreeBSP.Node = function( polygons ) {
    var i, polygon_count,
      front = [],
      back = [];

    this.polygons = [];
    this.front = this.back = undefined;
    
    if ( !(polygons instanceof Array) || polygons.length === 0 ) return;

    this.divider = polygons[0].clone();
    
    for ( i = 0, polygon_count = polygons.length; i < polygon_count; i++ ) {
      this.divider.splitPolygon( polygons[i], this.polygons, this.polygons, front, back );
    }   
    
    if ( front.length > 0 ) {
      this.front = new ThreeBSP.Node( front );
    }
    
    if ( back.length > 0 ) {
      this.back = new ThreeBSP.Node( back );
    }
  };
  ThreeBSP.Node.isConvex = function( polygons ) {
    var i, j;
    for ( i = 0; i < polygons.length; i++ ) {
      for ( j = 0; j < polygons.length; j++ ) {
        if ( i !== j && polygons[i].classifySide( polygons[j] ) !== BACK ) {
          return false;
        }
      }
    }
    return true;
  };
  ThreeBSP.Node.prototype.build = function( polygons ) {
    var i, polygon_count,
      front = [],
      back = [];
    
    if ( !this.divider ) {
      this.divider = polygons[0].clone();
    }

    for ( i = 0, polygon_count = polygons.length; i < polygon_count; i++ ) {
      this.divider.splitPolygon( polygons[i], this.polygons, this.polygons, front, back );
    }   
    
    if ( front.length > 0 ) {
      if ( !this.front ) this.front = new ThreeBSP.Node();
      this.front.build( front );
    }
    
    if ( back.length > 0 ) {
      if ( !this.back ) this.back = new ThreeBSP.Node();
      this.back.build( back );
    }
  };
  ThreeBSP.Node.prototype.allPolygons = function() {
    var polygons = this.polygons.slice();
    if ( this.front ) polygons = polygons.concat( this.front.allPolygons() );
    if ( this.back ) polygons = polygons.concat( this.back.allPolygons() );
    return polygons;
  };
  ThreeBSP.Node.prototype.clone = function() {
    var node = new ThreeBSP.Node();
    
    node.divider = this.divider.clone();
    node.polygons = this.polygons.map( function( polygon ) { return polygon.clone(); } );
    node.front = this.front && this.front.clone();
    node.back = this.back && this.back.clone();
    
    return node;
  };
  ThreeBSP.Node.prototype.invert = function() {
    var i, polygon_count, temp;
    
    for ( i = 0, polygon_count = this.polygons.length; i < polygon_count; i++ ) {
      this.polygons[i].flip();
    }
    
    this.divider.flip();
    if ( this.front ) this.front.invert();
    if ( this.back ) this.back.invert();
    
    temp = this.front;
    this.front = this.back;
    this.back = temp;
    
    return this;
  };
  ThreeBSP.Node.prototype.clipPolygons = function( polygons ) {
    var i, polygon_count,
      front, back;

    if ( !this.divider ) return polygons.slice();
    
    front = [], back = [];
    
    for ( i = 0, polygon_count = polygons.length; i < polygon_count; i++ ) {
      this.divider.splitPolygon( polygons[i], front, back, front, back );
    }

    if ( this.front ) front = this.front.clipPolygons( front );
    if ( this.back ) back = this.back.clipPolygons( back );
    else back = [];

    return front.concat( back );
  };
  
  ThreeBSP.Node.prototype.clipTo = function( node ) {
    this.polygons = node.clipPolygons( this.polygons );
    if ( this.front ) this.front.clipTo( node );
    if ( this.back ) this.back.clipTo( node );
  };
  
  
  return ThreeBSP;
})();